/**
 * JWT工具函数 - 用于生成和验证Token
 */

const jwt = require('jsonwebtoken');
const config = require('../config/config');

/**
 * 生成JWT Token
 * @param {Object} payload - 要加密的数据（通常是用户ID和角色）
 * @returns {String} - JWT Token字符串
 */
function generateToken(payload) {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  });
}

/**
 * 验证JWT Token
 * @param {String} token - JWT Token字符串
 * @returns {Object|null} - 解密后的数据，验证失败返回null
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    console.error('Token验证失败:', error.message);
    return null;
  }
}

/**
 * 从请求头中提取Token
 * @param {Object} req - Express请求对象
 * @returns {String|null} - Token字符串，没有则返回null
 */
function extractToken(req) {
  // 从Authorization头中提取: "Bearer <token>"
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7); // 移除 "Bearer " 前缀
  }
  return null;
}

module.exports = {
  generateToken,
  verifyToken,
  extractToken
};
