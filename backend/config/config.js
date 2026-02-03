/**
 * 应用配置文件
 */

require('dotenv').config();

module.exports = {
  // 服务器配置
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development'
  },

  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-this',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },

  // 邮件配置
  email: {
    host: process.env.EMAIL_HOST || 'smtp.qq.com',
    port: process.env.EMAIL_PORT || 587,
    user: process.env.EMAIL_USER || '',
    password: process.env.EMAIL_PASSWORD || '',
    from: process.env.EMAIL_FROM || '评分系统'
  },

  // 外部API配置
  externalApi: {
    url: process.env.EXTERNAL_API_URL || '',
    key: process.env.EXTERNAL_API_KEY || ''
  },

  // 验证码配置
  emailCode: {
    length: 6,              // 验证码长度
    expiresIn: 10,          // 过期时间（分钟）
    maxAttempts: 5          // 最大尝试次数
  },

  // 评分配置
  rating: {
    minScore: 1,            // 最低分
    maxScore: 5,            // 最高分
    maxCommentLength: 1000  // 评论最大长度
  }
};
