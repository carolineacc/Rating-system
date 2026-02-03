/**
 * 更新测试账号密码
 */

const bcrypt = require('bcrypt');
const { query } = require('./config/database');

async function updatePasswords() {
  try {
    console.log('正在更新密码...\n');

    // 生成密码哈希（password123）
    const passwordHash = await bcrypt.hash('password123', 10);

    // 更新所有测试账号的密码
    const result = await query(
      `UPDATE users SET password_hash = ? 
       WHERE email IN ('admin@example.com', 'user1@example.com', 'user2@example.com', 'test@example.com')`,
      [passwordHash]
    );

    console.log(`✅ 已更新 ${result.affectedRows} 个账号的密码`);
    console.log('\n测试账号信息：');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('邮箱：admin@example.com');
    console.log('密码：password123');
    console.log('角色：管理员\n');
    console.log('邮箱：user1@example.com');
    console.log('密码：password123');
    console.log('角色：普通用户');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ 更新失败:', error);
    process.exit(1);
  }
}

updatePasswords();
