/**
 * SSO单点登录控制器
 * 处理从现有网站的免登录跳转，并通过外部 API 自动同步用户和管理员数据
 */

const User = require('../models/User');
const Admin = require('../models/Admin');
const { generateToken } = require('../utils/jwt');
const { verifySign, verifyTimestamp } = require('../utils/signature');
const { getUserByEmail, getOrderByNo } = require('../services/externalApiService');

function isShowzAdminEmail(email) {
  return typeof email === 'string' && email.toLowerCase().endsWith('@showz.store');
}

/**
 * 免登录跳转验证
 * GET /api/sso/auto-login?email=xxx&orderNo=xxx&timestamp=xxx&sign=xxx
 * 
 * 注意：adminId 不再由外部网站传入，由后端从外部 API 自动获取
 */
async function autoLogin(req, res) {
  try {
    const { email, orderNo, timestamp, sign } = req.query;

    // 1. 验证必填参数
    if (!email || !timestamp || !sign) {
      return res.status(400).json({
        success: false,
        message: '参数不完整：email、timestamp、sign 为必填项'
      });
    }

    // 2. 验证时间戳（防止重放攻击，5分钟有效期）
    if (!verifyTimestamp(timestamp, 300)) {
      return res.status(400).json({
        success: false,
        message: '请求已过期，请重新从网站跳转'
      });
    }

    // 3. 验证签名（仅 email / orderNo / timestamp 参与签名，adminId 不再参与）
    const params = { email, timestamp };
    if (orderNo) params.orderNo = orderNo;
    if (!verifySign({ ...params, sign })) {
      return res.status(401).json({
        success: false,
        message: '签名验证失败，请求不合法'
      });
    }

    // 4. 调用外部 API 获取用户信息（含 ManageId / ManageUserName）
    let externalUser = null;
    let resolvedAdminId = null;

    try {
      externalUser = await getUserByEmail(email);
      if (externalUser) {
        console.log(`✅ 外部API获取用户信息成功: ${email} → 管理员: ${externalUser.ManageUserName}(${externalUser.ManageId})`);

        // 5. 自动 upsert 管理员到本地 admins 表
        if (externalUser.ManageId && externalUser.ManageUserName) {
          const admin = await Admin.upsertByExternalId(
            externalUser.ManageId,
            externalUser.ManageUserName
          );
          resolvedAdminId = admin ? admin.id : null;
        }
      }
    } catch (e) {
      console.warn('外部API获取用户信息失败（不影响登录）:', e.message);
    }

    // 6. 查找或创建本地用户，同步昵称和角色
    let user = await User.findByEmail(email);
    const username = externalUser?.NickName || email.split('@')[0];
    const role = isShowzAdminEmail(email) ? 'admin' : 'user';

    if (!user) {
      user = await User.create({ email, username, role });
      console.log(`✅ 自动创建用户: ${email} (${username})`);
    } else {
      // 同步昵称
      if (externalUser?.NickName && user.username !== externalUser.NickName) {
        await User.updateUsername(user.id, externalUser.NickName);
        user.username = externalUser.NickName;
      }
      // 自动升级为管理员
      if (isShowzAdminEmail(email) && user.role !== 'admin') {
        await User.updateRole(user.id, 'admin');
        user.role = 'admin';
      }
    }

    // 7. 快速校验订单号是否存在（不阻塞登录）
    if (orderNo) {
      try {
        const orderData = await getOrderByNo(orderNo);
        if (orderData?.orders?.OId) {
          console.log(`✅ 外部API校验订单号存在: ${orderNo}`);
        }
      } catch (e) {
        console.warn('外部API订单号校验失败（不影响登录）:', e.message);
      }
    }

    // 8. 生成 JWT Token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    // 9. 记录登录日志
    await User.logLogin({
      userId: user.id,
      email: user.email,
      method: 'sso',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    console.log(`✅ 免登录跳转成功: ${email} → 订单: ${orderNo || '未指定'} → adminId: ${resolvedAdminId}`);

    // 10. 返回成功响应（adminId 由后端自动解析，不再由前端 URL 传入）
    return res.json({
      success: true,
      message: '验证成功',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role
        },
        orderNo: orderNo || null,
        adminId: resolvedAdminId  // 后端自动从外部 API 解析出来的管理员ID
      }
    });

  } catch (error) {
    console.error('免登录跳转错误:', error);
    return res.status(500).json({
      success: false,
      message: '验证失败，请稍后重试'
    });
  }
}

module.exports = { autoLogin };
