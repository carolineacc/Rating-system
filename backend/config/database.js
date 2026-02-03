/**
 * 数据库配置和连接池管理
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

// 创建数据库连接池
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',     // 数据库地址
  port: process.env.DB_PORT || 3306,            // 数据库端口
  user: process.env.DB_USER || 'root',          // 数据库用户名
  password: process.env.DB_PASSWORD || '',      // 数据库密码
  database: process.env.DB_NAME || 'rating_system', // 数据库名称
  waitForConnections: true,                     // 等待可用连接
  connectionLimit: 10,                          // 连接池最大连接数
  queueLimit: 0,                                // 队列限制（0表示不限制）
  charset: 'utf8mb4'                            // 字符集
});

// 测试数据库连接
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ 数据库连接成功！');
    connection.release(); // 释放连接回连接池
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    return false;
  }
}

// 执行查询的辅助函数
async function query(sql, params) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
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
