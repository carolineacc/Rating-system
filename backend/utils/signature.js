/**
 * 签名工具
 * 用于验证来自现有网站的免登录跳转请求
 */

const crypto = require('crypto');

// 共享密钥（与现有网站相同）
const SHARED_SECRET = 'bfd150510a4b6b6';

/**
 * 生成签名（与现有网站API的签名算法相同）
 * @param {Object} data - 参数对象
 * @param {string} secret - 密钥（可选，默认使用共享密钥）
 * @returns {string} - MD5签名
 */
function generateSign(data, secret = SHARED_SECRET) {
  // 1. 过滤掉sign字段和空值
  const filteredData = {};
  for (const [key, value] of Object.entries(data)) {
    if (key !== 'sign' && key !== 'Sign' && value !== '' && value !== null && value !== undefined) {
      // 去除首尾空白
      filteredData[key] = typeof value === 'string' ? value.trim() : String(value);
    }
  }

  // 2. 按键名升序排序
  const sortedKeys = Object.keys(filteredData).sort();

  // 3. 拼接字符串: key1=value1&key2=value2&...
  let str = '';
  for (const key of sortedKeys) {
    str += `${key}=${filteredData[key]}&`;
  }

  // 4. 加上 key=密钥
  str += `key=${secret}`;

  // 5. MD5加密
  return crypto.createHash('md5').update(str).digest('hex');
}

/**
 * 验证签名
 * @param {Object} data - 包含sign字段的参数对象
 * @param {string} secret - 密钥（可选）
 * @returns {boolean} - 签名是否有效
 */
function verifySign(data, secret = SHARED_SECRET) {
  if (!data.sign) {
    return false;
  }

  const receivedSign = data.sign;
  const calculatedSign = generateSign(data, secret);

  return receivedSign === calculatedSign;
}

/**
 * 验证时间戳（防止重放攻击）
 * @param {string|number} timestamp - 时间戳（秒）
 * @param {number} maxAge - 最大有效期（秒），默认300秒（5分钟）
 * @returns {boolean} - 时间戳是否有效
 */
function verifyTimestamp(timestamp, maxAge = 300) {
  if (!timestamp) {
    return false;
  }

  const now = Math.floor(Date.now() / 1000);
  const diff = Math.abs(now - parseInt(timestamp));

  // 时间差在允许范围内
  return diff <= maxAge;
}

module.exports = {
  generateSign,
  verifySign,
  verifyTimestamp,
  SHARED_SECRET
};
