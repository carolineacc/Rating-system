/**
 * SSO单点登录控制器
 * 处理从现有网站的免登录跳转
 */

const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { verifySign, verifyTimestamp } = require('../utils/signature');

/**
 * 免登录跳转验证
 * GET /api/sso/auto-login?email=xxx&orderNo=xxx&timestamp=xxx&sign=xxx
 * 
 * 请求参数:
 * - email: 用户邮箱（必填）
 * - orderNo: 订单号（可选）
 * - timestamp: 时间戳（必填）
 * - sign: 签名（必填）
 * 
 * 响应:
 * {
 *   "success": true,
 *   "message": "验证成功",
 *   "data": {
 *     "token": "eyJhbGc...",
 *     "user": { ... },
 *     "orderNo": "ORD123"
 *   }
 * }
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
    const params = { email, orderNo, timestamp };
    if (!verifySign({ ...params, sign })) {
      return res.status(401).json({
        success: false,
        message: '签名验证失败，请求不合法'
      });
    }

    // 4. 查找或创建用户
    let user = await User.findByEmail(email);

    if (!user) {
      // 用户不存在，自动创建
      user = await User.create({
        email,
        username: email.split('@')[0],
        role: 'user'
      });
      console.log(`✅ 自动创建用户: ${email}`);
    }

    // 5. 生成评分系统的 JWT Token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    // 6. 记录登录日志
    await User.logLogin({
      userId: user.id,
      email: user.email,
      method: 'sso',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    console.log(`✅ 免登录跳转成功: ${email} → 订单: ${orderNo || '未指定'}`);

    // 7. 返回成功响应
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
        orderNo: orderNo || null
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

module.exports = {
  autoLogin
};
