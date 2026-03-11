/**
 * SSO单点登录控制器
 * 处理从现有网站的免登录跳转，并同步外部 API 的用户和订单数据
 */

const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { verifySign, verifyTimestamp } = require('../utils/signature');
const { getUserByEmail, getOrderByNo, formatOrderStatus } = require('../services/externalApiService');

/**
 * 免登录跳转验证
 * GET /api/sso/auto-login?email=xxx&orderNo=xxx&timestamp=xxx&sign=xxx
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

    // 3. 验证签名（确保请求来自合法来源）
    const params = { email, timestamp };
    if (orderNo) params.orderNo = orderNo;
    if (!verifySign({ ...params, sign })) {
      return res.status(401).json({
        success: false,
        message: '签名验证失败，请求不合法'
      });
    }

    // 4. 从外部 API 获取用户信息（异步，不阻塞主流程）
    let externalUser = null;
    try {
      externalUser = await getUserByEmail(email);
      if (externalUser) {
        console.log(`✅ 外部API获取用户信息成功: ${email} (${externalUser.NickName})`);
      }
    } catch (e) {
      console.warn('外部API获取用户信息失败（不影响登录）:', e.message);
    }

    // 5. 查找或创建本地用户，并同步外部信息
    let user = await User.findByEmail(email);

    if (!user) {
      // 新用户：用外部 API 的昵称作为用户名
      const username = externalUser?.NickName || email.split('@')[0];
      user = await User.create({ email, username, role: 'user' });
      console.log(`✅ 自动创建用户: ${email} (${username})`);
    } else if (externalUser?.NickName && user.username !== externalUser.NickName) {
      // 已有用户：同步最新昵称
      await User.updateUsername(user.id, externalUser.NickName);
      user.username = externalUser.NickName;
    }

    // 6. 从外部 API 获取订单信息
    let orderInfo = null;
    if (orderNo) {
      try {
        const orderData = await getOrderByNo(orderNo);
        if (orderData) {
          const o = orderData.orders;
          const products = orderData.orders_products_list || [];
          orderInfo = {
            orderNo: o.OId,
            status: formatOrderStatus(o.OrderStatus, o.IsPresale === '1'),
            statusCode: o.OrderStatus,
            isPresale: o.IsPresale === '1',
            totalPrice: o.OrderTotalPrice,
            currency: o.Currency,
            paymentMethod: o.PaymentMethod,
            orderTime: o.OrderTime,
            products: products.map(p => ({
              name: p.Name,
              sku: p.SKU,
              qty: p.Qty,
              price: p.Price,
              image: p.PicPath,
              url: p.ProductsUrl
            }))
          };
          console.log(`✅ 外部API获取订单信息成功: ${orderNo}`);
        }
      } catch (e) {
        console.warn('外部API获取订单信息失败（不影响登录）:', e.message);
      }
    }

    // 7. 生成 JWT Token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    // 8. 记录登录日志
    await User.logLogin({
      userId: user.id,
      email: user.email,
      method: 'sso',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    console.log(`✅ 免登录跳转成功: ${email} → 订单: ${orderNo || '未指定'}`);

    // 9. 返回成功响应
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
        orderInfo  // 订单详情（可能为 null）
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
