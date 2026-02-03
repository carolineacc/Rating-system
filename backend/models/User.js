/**
 * 用户数据模型
 * 处理用户相关的数据库操作
 */

const { query } = require('../config/database');
const bcrypt = require('bcrypt');

class User {
  /**
   * 根据邮箱查找用户
   * @param {String} email - 用户邮箱
   * @returns {Object|null} - 用户对象或null
   */
  static async findByEmail(email) {
    const sql = 'SELECT * FROM users WHERE email = ? LIMIT 1';
    const users = await query(sql, [email]);
    return users.length > 0 ? users[0] : null;
  }

  /**
   * 根据ID查找用户
   * @param {Number} id - 用户ID
   * @returns {Object|null} - 用户对象或null
   */
  static async findById(id) {
    const sql = 'SELECT id, email, username, role, created_at FROM users WHERE id = ? LIMIT 1';
    const users = await query(sql, [id]);
    return users.length > 0 ? users[0] : null;
  }

  /**
   * 创建新用户
   * @param {Object} userData - 用户数据
   * @returns {Object} - 创建的用户信息
   */
  static async create(userData) {
    const { email, password, username, role = 'user' } = userData;
    
    // 如果提供了密码，则进行加密
    let passwordHash = null;
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }
    
    const sql = `
      INSERT INTO users (email, password_hash, username, role) 
      VALUES (?, ?, ?, ?)
    `;
    
    const result = await query(sql, [email, passwordHash, username || email.split('@')[0], role]);
    
    return {
      id: result.insertId,
      email,
      username: username || email.split('@')[0],
      role
    };
  }

  /**
   * 验证密码
   * @param {String} plainPassword - 明文密码
   * @param {String} hashedPassword - 加密后的密码
   * @returns {Boolean} - 密码是否匹配
   */
  static async verifyPassword(plainPassword, hashedPassword) {
    if (!hashedPassword) return false;
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * 更新用户信息
   * @param {Number} id - 用户ID
   * @param {Object} updates - 要更新的字段
   * @returns {Boolean} - 是否更新成功
   */
  static async update(id, updates) {
    const allowedFields = ['username', 'phone'];
    const fields = [];
    const values = [];
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }
    
    if (fields.length === 0) return false;
    
    values.push(id);
    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    await query(sql, values);
    return true;
  }

  /**
   * 更新密码
   * @param {Number} id - 用户ID
   * @param {String} newPassword - 新密码
   * @returns {Boolean} - 是否更新成功
   */
  static async updatePassword(id, newPassword) {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const sql = 'UPDATE users SET password_hash = ? WHERE id = ?';
    await query(sql, [passwordHash, id]);
    return true;
  }

  /**
   * 保存邮箱验证码
   * @param {String} email - 邮箱
   * @param {String} code - 验证码
   * @param {String} purpose - 用途 (login/register/reset)
   * @returns {Boolean} - 是否保存成功
   */
  static async saveEmailCode(email, code, purpose = 'login') {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10分钟后过期
    const sql = `
      INSERT INTO email_codes (email, code, purpose, expires_at) 
      VALUES (?, ?, ?, ?)
    `;
    await query(sql, [email, code, purpose, expiresAt]);
    return true;
  }

  /**
   * 验证邮箱验证码
   * @param {String} email - 邮箱
   * @param {String} code - 验证码
   * @returns {Boolean} - 验证码是否正确
   */
  static async verifyEmailCode(email, code) {
    const sql = `
      SELECT * FROM email_codes 
      WHERE email = ? AND code = ? AND is_used = 0 AND expires_at > NOW()
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    const codes = await query(sql, [email, code]);
    
    if (codes.length === 0) return false;
    
    // 标记验证码为已使用
    const updateSql = 'UPDATE email_codes SET is_used = 1 WHERE id = ?';
    await query(updateSql, [codes[0].id]);
    
    return true;
  }

  /**
   * 记录登录日志
   * @param {Object} logData - 登录日志数据
   */
  static async logLogin(logData) {
    const { userId, email, method, ipAddress, userAgent, status = 'success' } = logData;
    const sql = `
      INSERT INTO login_logs (user_id, email, login_method, ip_address, user_agent, status) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    await query(sql, [userId, email, method, ipAddress, userAgent, status]);
  }
}

module.exports = User;
