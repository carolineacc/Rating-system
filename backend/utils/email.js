/**
 * 邮件发送工具
 */

const nodemailer = require('nodemailer');
const config = require('../config/config');

// 创建邮件发送器
const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: false, // 使用TLS
  auth: {
    user: config.email.user,
    pass: config.email.password
  }
});

/**
 * 生成随机验证码
 * @param {Number} length - 验证码长度
 * @returns {String} - 验证码
 */
function generateCode(length = 6) {
  const chars = '0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * 发送验证码邮件
 * @param {String} email - 接收邮箱
 * @param {String} code - 验证码
 * @returns {Promise<Boolean>} - 发送是否成功
 */
async function sendVerificationCode(email, code) {
  try {
    // 如果没有配置邮件服务，则在控制台输出验证码（开发环境）
    if (!config.email.user || !config.email.password) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 开发模式：验证码邮件');
      console.log(`收件人: ${email}`);
      console.log(`验证码: ${code}`);
      console.log('有效期: 10分钟');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return true;
    }

    // 发送邮件
    const mailOptions = {
      from: config.email.from,
      to: email,
      subject: '评分系统 - 登录验证码',
      html: `
        <div style="padding: 20px; font-family: Arial, sans-serif;">
          <h2 style="color: #1890ff;">评分系统</h2>
          <p>您的登录验证码是：</p>
          <div style="background: #f0f0f0; padding: 15px; margin: 20px 0; font-size: 24px; font-weight: bold; letter-spacing: 5px; text-align: center;">
            ${code}
          </div>
          <p style="color: #666;">验证码有效期为10分钟，请及时使用。</p>
          <p style="color: #999; font-size: 12px;">如果这不是您的操作，请忽略此邮件。</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ 验证码邮件已发送至: ${email}`);
    return true;
  } catch (error) {
    console.error('❌ 邮件发送失败:', error.message);
    return false;
  }
}

/**
 * 发送评分提醒邮件
 * @param {String} email - 接收邮箱
 * @param {String} orderNo - 订单号
 * @returns {Promise<Boolean>} - 发送是否成功
 */
async function sendRatingReminder(email, orderNo) {
  try {
    const mailOptions = {
      from: config.email.from,
      to: email,
      subject: '您有一个订单待评价',
      html: `
        <div style="padding: 20px; font-family: Arial, sans-serif;">
          <h2 style="color: #1890ff;">订单评价提醒</h2>
          <p>您的订单 <strong>${orderNo}</strong> 已完成，欢迎进行评价。</p>
          <p style="margin: 20px 0;">
            <a href="#" style="background: #1890ff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
              立即评价
            </a>
          </p>
          <p style="color: #666; font-size: 12px;">您的反馈对我们非常重要，感谢您的支持！</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('邮件发送失败:', error);
    return false;
  }
}

module.exports = {
  generateCode,
  sendVerificationCode,
  sendRatingReminder
};
