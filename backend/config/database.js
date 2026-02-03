/**
 * 数据库配置和连接池管理
 * 支持 PostgreSQL 和 MySQL
 */

const { Pool } = require('pg');
require('dotenv').config();

// 创建PostgreSQL连接池
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,  // Render提供的数据库URL
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// 测试数据库连接
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ 数据库连接成功！');
    client.release(); // 释放连接回连接池
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    return false;
  }
}

// 执行查询的辅助函数（兼容PostgreSQL）
async function query(sql, params = []) {
  try {
    // PostgreSQL 使用 $1, $2, $3... 作为占位符
    // 将 MySQL 的 ? 替换为 PostgreSQL 的 $1, $2...
    let pgSql = sql;
    let paramIndex = 1;
    while (pgSql.includes('?')) {
      pgSql = pgSql.replace('?', `$${paramIndex}`);
      paramIndex++;
    }
    
    const result = await pool.query(pgSql, params);
    return result.rows;
  } catch (error) {
    console.error('数据库查询错误:', error);
    throw error;
  }
}

module.exports = {
  pool,
  query,
  testConnection
};
