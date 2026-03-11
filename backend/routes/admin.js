/**
 * 管理员路由
 * 提供管理员列表等接口
 */

const express = require('express');
const router = express.Router();
const { getAdminList } = require('../controllers/adminController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// GET /api/admins - 获取管理员列表（需要管理员权限）
router.get('/', authMiddleware, adminMiddleware, getAdminList);

module.exports = router;

