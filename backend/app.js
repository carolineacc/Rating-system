/**
 * 评分系统后端主文件
 * 
 * 这是后端应用的入口文件，负责：
 * 1. 初始化Express应用
 * 2. 配置中间件
 * 3. 注册路由
 * 4. 启动HTTP服务器
 * 5. 连接数据库
 */

// ==================== 导入依赖模块 ====================
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config(); // 加载环境变量

const { testConnection } = require('./config/database');
const config = require('./config/config');

// 导入路由
const authRoutes = require('./routes/auth');
const ratingRoutes = require('./routes/rating');
const ssoRoutes = require('./routes/sso');


// ==================== 创建Express应用 ====================
const app = express();


// ==================== 配置中间件 ====================

// 1. 安全相关中间件
app.use(helmet()); // 设置HTTP安全头

// 2. CORS跨域配置（允许前端访问后端API）
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'], // 允许的前端地址
  credentials: true // 允许携带Cookie
}));

// 3. 请求体解析中间件
app.use(express.json()); // 解析JSON格式的请求体
app.use(express.urlencoded({ extended: true })); // 解析URL编码的请求体

// 4. 请求日志中间件（开发环境）
if (config.server.env === 'development') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// 5. 速率限制（防止暴力攻击）
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP 15分钟内最多100个请求
  message: '请求过于频繁，请稍后再试'
});
app.use('/api/', limiter);


// ==================== 注册路由 ====================

// 健康检查接口（用于测试服务器是否正常运行）
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '评分系统API服务运行中',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// 认证相关路由
app.use('/api/auth', authRoutes);

// 评分相关路由
app.use('/api/ratings', ratingRoutes);

// SSO免登录跳转路由
app.use('/api/sso', ssoRoutes);

// 404错误处理（未找到的路由）
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '请求的API接口不存在',
    path: req.path
  });
});

// 全局错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || '服务器内部错误',
    ...(config.server.env === 'development' && { stack: err.stack }) // 开发环境下返回错误堆栈
  });
});


// ==================== 启动服务器 ====================

async function startServer() {
  try {
    // 1. 测试数据库连接
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📦 正在启动评分系统后端服务...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ 数据库连接失败，请检查配置');
      console.error('提示：确保MySQL已启动，并且.env文件中的数据库配置正确');
      process.exit(1); // 退出程序
    }

    // 2. 启动HTTP服务器
    const PORT = config.server.port;
    
    app.listen(PORT, () => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`✅ 服务器启动成功！`);
      console.log(`📍 服务器地址: http://localhost:${PORT}`);
      console.log(`🌍 环境: ${config.server.env}`);
      console.log(`📅 启动时间: ${new Date().toLocaleString('zh-CN')}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('💡 可用的API端点:');
      console.log(`   GET  http://localhost:${PORT}/              - 健康检查`);
      console.log(`   POST http://localhost:${PORT}/api/auth/login - 用户登录`);
      console.log(`   POST http://localhost:${PORT}/api/ratings    - 创建评分`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✨ 按 Ctrl+C 停止服务器');
      console.log('');
    });

  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n正在关闭服务器...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n正在关闭服务器...');
  process.exit(0);
});

// 启动服务器
startServer();

// 导出app供测试使用
module.exports = app;
