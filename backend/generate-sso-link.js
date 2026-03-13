/**
 * 免登录跳转链接生成器
 * 用于测试和演示如何生成跳转链接
 * 
 * 注意：adminId 不再需要由外部网站传入，
 *       评分系统后端会通过 sync_get_user 自动从外部 API 获取用户对应的管理员。
 */

const { generateSign } = require('./utils/signature');

/**
 * 生成免登录跳转链接
 * @param {string} email   - 用户邮箱（外部系统已登录的用户）
 * @param {string} orderNo - 订单号（可选）
 * @param {string} baseUrl - 评分系统地址（默认生产环境）
 * @returns {string} - 完整的跳转链接
 */
function generateSSOLink(email, orderNo = '', baseUrl = 'https://rating-system-frontend.onrender.com') {
  const timestamp = String(Math.floor(Date.now() / 1000));

  const params = { email, timestamp };
  if (orderNo) params.orderNo = orderNo;

  const sign = generateSign(params);

  const query = new URLSearchParams({
    email,
    ...(orderNo && { orderNo }),
    timestamp,
    sign
  }).toString();

  return `${baseUrl}/sso?${query}`;
}

// ==================== 测试示例 ====================

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  免登录跳转链接生成器');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const testEmail = process.argv[2] || 'test@example.com';
const testOrderNo = process.argv[3] || '';

const link = generateSSOLink(testEmail, testOrderNo);
console.log(`用户：${testEmail}`);
if (testOrderNo) console.log(`订单：${testOrderNo}`);
console.log('链接（5分钟有效）：');
console.log(link);
console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('💡 使用方法：');
console.log('   node generate-sso-link.js <email> <orderNo>');
console.log('   例：node generate-sso-link.js user@example.com ORD123456');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

module.exports = { generateSSOLink };
