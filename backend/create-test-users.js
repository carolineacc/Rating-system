/**
 * 创建测试账号脚本
 * 用于快速创建可登录的测试用户
 */

const bcrypt = require('bcrypt');
const { query } = require('./config/database');

async function createTestUsers() {
  try {
    console.log('开始创建测试账号...\n');

    // 生成密码哈希（password123）
    const passwordHash = await bcrypt.hash('password123', 10);
    console.log('密码哈希已生成');

    // 创建测试用户
    const users = [
      { email: 'admin@example.com', username: '管理员', role: 'admin' },
      { email: 'user1@example.com', username: '用户1', role: 'user' },
      { email: 'user2@example.com', username: '用户2', role: 'user' },
      { email: 'test@example.com', username: '测试用户', role: 'user' }
    ];

    for (const user of users) {
      // 检查用户是否已存在
      const existing = await query('SELECT id FROM users WHERE email = ?', [user.email]);
      
      if (existing.length > 0) {
        console.log(`✓ ${user.email} 已存在，跳过`);
        continue;
      }

      // 插入用户
      await query(
        'INSERT INTO users (email, password_hash, username, role) VALUES (?, ?, ?, ?)',
        [user.email, passwordHash, user.username, user.role]
      );
      console.log(`✓ 创建成功: ${user.email} (${user.role})`);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ 测试账号创建完成！');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📋 可用账号：\n');
    console.log('管理员：');
    console.log('  邮箱：admin@example.com');
    console.log('  密码：password123\n');
    console.log('普通用户：');
    console.log('  邮箱：user1@example.com');
    console.log('  密码：password123\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ 创建失败:', error);
    process.exit(1);
  }
}

createTestUsers();
