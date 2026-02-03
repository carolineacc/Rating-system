# 评分系统

一个用于收集用户对订单服务评价的系统。

## 项目结构

```
rating-system/
├── backend/          # 后端服务（Node.js + Express）
├── frontend/         # 前端应用（React + Vite + Ant Design）
├── database/         # 数据库初始化脚本
├── 安装指南.md       # 环境安装教程
└── README.md         # 本文件
```

## 功能特性

### 用户端
- ✅ 邮箱验证码登录
- ✅ 账号密码登录
- ✅ 订单评分（星级评分）
- ✅ 订单评价（文字评语）
- ✅ 每个订单仅可评价一次

### 管理员端
- ✅ 查看所有评分评价
- ✅ 按管理员筛选
- ✅ 按时间筛选
- ✅ 数据统计分析
- ✅ 导出Excel报表

## 快速开始

### 1. 安装环境
请先阅读 `安装指南.md` 安装必要的开发工具。

### 2. 初始化数据库
```bash
# 登录 MySQL
mysql -u root -p

# 执行数据库初始化脚本
source d:/Rating system/database/init.sql
```

### 3. 启动后端服务
```bash
cd backend
npm install
npm start
```
后端将运行在：http://localhost:3000

### 4. 启动前端应用
```bash
cd frontend
npm install
npm run dev
```
前端将运行在：http://localhost:5173

## 技术栈

- **前端**：React 18 + Vite + Ant Design + Axios
- **后端**：Node.js + Express + MySQL + JWT
- **数据库**：MySQL 8.0

## 开发说明

所有代码都有详细的中文注释，便于理解和修改。

## 下一步

1. ✅ 完成环境安装
2. ✅ 启动项目
3. 🔄 对接现有网站API
4. 🔄 部署到服务器

## 需要帮助？

遇到任何问题，随时询问！
