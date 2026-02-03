/**
 * 免登录跳转链接生成器
 * 用于测试和演示如何生成跳转链接
 */

const { generateSign } = require('./utils/signature');

/**
 * 生成免登录跳转链接
 * @param {string} email - 用户邮箱
 * @param {string} orderNo - 订单号（可选）
 * @param {string} baseUrl - 评分系统地址（默认本地）
 * @returns {string} - 完整的跳转链接
 */
function generateSSOLink(email, orderNo = '', baseUrl = 'http://localhost:5173') {
  // 1. 准备参数
  const timestamp = Math.floor(Date.now() / 1000); // 当前时间戳（秒）
  
  const params = {
    email,
    orderNo,
    timestamp: String(timestamp)
  };

  // 2. 生成签名
  const sign = generateSign(params);

  // 3. 构建URL
  const query = new URLSearchParams({
    email,
    ...(orderNo && { orderNo }), // 订单号可选
    timestamp: String(timestamp),
    sign
  }).toString();

  const link = `${baseUrl}/sso?${query}`;

  return link;
}

// ==================== 测试示例 ====================

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  免登录跳转链接生成器');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// 示例1：带订单号的跳转
const link1 = generateSSOLink('test@example.com', 'ORD2024010001');
console.log('示例1：带订单号的跳转');
console.log('用户：test@example.com');
console.log('订单：ORD2024010001');
console.log('链接：');
console.log(link1);
console.log('');

// 示例2：不带订单号的跳转
const link2 = generateSSOLink('user1@example.com');
console.log('示例2：不带订单号的跳转');
console.log('用户：user1@example.com');
console.log('链接：');
console.log(link2);
console.log('');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('💡 使用说明：');
console.log('1. 直接复制链接到浏览器访问');
console.log('2. 或者在现有网站的按钮点击时调用类似逻辑');
console.log('3. 链接有效期5分钟');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// 导出函数供其他模块使用
module.exports = { generateSSOLink };
