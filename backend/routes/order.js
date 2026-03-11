/**
 * 订单路由
 * 提供订单查询接口（通过外部 API 获取真实订单数据）
 */

const express = require('express');
const router = express.Router();
const { getOrderDetails } = require('../controllers/orderController');
const { authMiddleware } = require('../middleware/auth');

// GET /api/orders/:orderNo - 获取订单详情（需要登录）
router.get('/:orderNo', authMiddleware, getOrderDetails);

module.exports = router;
