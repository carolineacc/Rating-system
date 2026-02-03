/**
 * 评分路由
 * 定义评分相关的API路由
 */

const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

/**
 * @route   POST /api/ratings
 * @desc    创建评分（用户评价订单）
 * @access  Private（需要用户登录）
 */
router.post('/', authMiddleware, ratingController.createRating);

/**
 * @route   GET /api/ratings
 * @desc    获取评分列表（带筛选和分页）
 * @access  Private（需要管理员权限）
 */
router.get('/', authMiddleware, adminMiddleware, ratingController.getRatingList);

/**
 * @route   GET /api/ratings/statistics
 * @desc    获取统计数据
 * @access  Private（需要管理员权限）
 * @note    这个路由必须放在 /:id 之前，否则 "statistics" 会被当作 id 处理
 */
router.get('/statistics', authMiddleware, adminMiddleware, ratingController.getStatistics);

/**
 * @route   GET /api/ratings/check/:orderNo
 * @desc    检查订单是否已评分
 * @access  Private（需要用户登录）
 */
router.get('/check/:orderNo', authMiddleware, ratingController.checkRated);

/**
 * @route   GET /api/ratings/:id
 * @desc    获取单个评分详情
 * @access  Private（需要登录，用户只能查看自己的评分，管理员可以查看所有）
 */
router.get('/:id', authMiddleware, ratingController.getRatingById);

/**
 * @route   POST /api/ratings/:id/reply
 * @desc    管理员回复评价
 * @access  Private（需要管理员权限）
 */
router.post('/:id/reply', authMiddleware, adminMiddleware, ratingController.addReply);

/**
 * @route   GET /api/ratings/:id/replies
 * @desc    获取评分的回复列表
 * @access  Private（需要登录）
 */
router.get('/:id/replies', authMiddleware, ratingController.getReplies);

module.exports = router;
