/**
 * 认证控制器
 * 处理用户登录、注册等认证相关的业务逻辑
 */

const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { generateCode, sendVerificationCode } = require('../utils/email');

/**
 * 发送邮箱验证码
 * POST /api/auth/send-code
 * 
 * 请求参数:
 * {
 *   "email": "user@example.com"
 * }
 * 
 * 响应:
 * {
 *   "success": true,
 *   "message": "验证码已发送"
 * }
 */
async function sendEmailCode(req, res) {
  try {
    const { email } = req.body;

    // 1. 验证邮箱格式
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: '邮箱格式不正确'
      });
    }

    // 2. 生成6位数字验证码
    const code = generateCode(6);

    // 3. 保存验证码到数据库
    await User.saveEmailCode(email, code, 'login');

    // 4. 发送验证码邮件
    const sent = await sendVerificationCode(email, code);

    if (!sent) {
      return res.status(500).json({
        success: false,
        message: '验证码发送失败，请稍后重试'
      });
    }

    // 5. 返回成功响应
    return res.json({
      success: true,
      message: '验证码已发送，请查收邮件（有效期10分钟）'
    });

  } catch (error) {
    console.error('发送验证码错误:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误，请稍后重试'
    });
  }
}

/**
 * 邮箱验证码登录
 * POST /api/auth/login-by-code
 * 
 * 请求参数:
 * {
 *   "email": "user@example.com",
 *   "code": "123456"
 * }
 * 
 * 响应:
 * {
 *   "success": true,
 *   "message": "登录成功",
 *   "data": {
 *     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *     "user": { "id": 1, "email": "...", "role": "user" }
 *   }
 * }
 */
async function loginByEmailCode(req, res) {
  try {
    const { email, code } = req.body;

    // 1. 验证必填参数
    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: '邮箱和验证码不能为空'
      });
    }

    // 2. 验证验证码是否正确
    const isCodeValid = await User.verifyEmailCode(email, code);

    if (!isCodeValid) {
      return res.status(400).json({
        success: false,
        message: '验证码错误或已过期'
      });
    }

    // 3. 查找或创建用户
    let user = await User.findByEmail(email);

    if (!user) {
      // 如果用户不存在，自动注册（邮箱登录的特性）
      user = await User.create({
        email,
        username: email.split('@')[0], // 使用邮箱前缀作为用户名
        role: 'user'
      });
    }

    // 4. 生成JWT Token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    // 5. 记录登录日志
    await User.logLogin({
      userId: user.id,
      email: user.email,
      method: 'email_code',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    // 6. 返回成功响应
    return res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role
        }
      }
    });

  } catch (error) {
    console.error('邮箱验证码登录错误:', error);
    return res.status(500).json({
      success: false,
      message: '登录失败，请稍后重试'
    });
  }
}

/**
 * 账号密码登录
 * POST /api/auth/login
 * 
 * 请求参数:
 * {
 *   "email": "user@example.com",
 *   "password": "password123"
 * }
 * 
 * 响应:
 * {
 *   "success": true,
 *   "message": "登录成功",
 *   "data": {
 *     "token": "...",
 *     "user": { ... }
 *   }
 * }
 */
async function loginByPassword(req, res) {
  try {
    const { email, password } = req.body;

    // 1. 验证必填参数
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '邮箱和密码不能为空'
      });
    }

    // 2. 查找用户
    const user = await User.findByEmail(email);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '邮箱或密码错误'
      });
    }

    // 3. 验证密码
    const isPasswordValid = await User.verifyPassword(password, user.password_hash);

    if (!isPasswordValid) {
      // 记录失败的登录尝试
      await User.logLogin({
        userId: user.id,
        email: user.email,
        method: 'password',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        status: 'failed'
      });

      return res.status(401).json({
        success: false,
        message: '邮箱或密码错误'
      });
    }

    // 4. 生成JWT Token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    // 5. 记录成功的登录
    await User.logLogin({
      userId: user.id,
      email: user.email,
      method: 'password',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    // 6. 返回成功响应
    return res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role
        }
      }
    });

  } catch (error) {
    console.error('密码登录错误:', error);
    return res.status(500).json({
      success: false,
      message: '登录失败，请稍后重试'
    });
  }
}

/**
 * 注册新用户（账号密码方式）
 * POST /api/auth/register
 * 
 * 请求参数:
 * {
 *   "email": "user@example.com",
 *   "password": "password123",
 *   "username": "用户名"
 * }
 * 
 * 响应:
 * {
 *   "success": true,
 *   "message": "注册成功",
 *   "data": {
 *     "token": "...",
 *     "user": { ... }
 *   }
 * }
 */
async function register(req, res) {
  try {
    const { email, password, username } = req.body;

    // 1. 验证必填参数
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '邮箱和密码不能为空'
      });
    }

    // 2. 验证邮箱格式
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: '邮箱格式不正确'
      });
    }

    // 3. 验证密码强度（至少6位）
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: '密码长度至少为6位'
      });
    }

    // 4. 检查邮箱是否已注册
    const existingUser = await User.findByEmail(email);

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '该邮箱已被注册'
      });
    }

    // 5. 创建新用户
    const user = await User.create({
      email,
      password,
      username: username || email.split('@')[0],
      role: 'user'
    });

    // 6. 生成JWT Token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    // 7. 记录登录日志
    await User.logLogin({
      userId: user.id,
      email: user.email,
      method: 'password',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    // 8. 返回成功响应
    return res.json({
      success: true,
      message: '注册成功',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role
        }
      }
    });

  } catch (error) {
    console.error('注册错误:', error);
    return res.status(500).json({
      success: false,
      message: '注册失败，请稍后重试'
    });
  }
}

/**
 * 获取当前登录用户信息
 * GET /api/auth/me
 * 需要认证
 * 
 * 响应:
 * {
 *   "success": true,
 *   "data": {
 *     "id": 1,
 *     "email": "user@example.com",
 *     "username": "用户名",
 *     "role": "user"
 *   }
 * }
 */
async function getCurrentUser(req, res) {
  try {
    // req.user 是在 authMiddleware 中间件中设置的
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    return res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('获取用户信息错误:', error);
    return res.status(500).json({
      success: false,
      message: '获取用户信息失败'
    });
  }
}

// 导出所有控制器函数
module.exports = {
  sendEmailCode,
  loginByEmailCode,
  loginByPassword,
  register,
  getCurrentUser
};
