/**
 * 认证路由
 * 定义用户登录、注册等相关的API路由
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

/**
 * @route   POST /api/auth/send-code
 * @desc    发送邮箱验证码
 * @access  Public（无需登录）
 */
router.post('/send-code', authController.sendEmailCode);

/**
 * @route   POST /api/auth/login-by-code
 * @desc    使用邮箱验证码登录
 * @access  Public（无需登录）
 */
router.post('/login-by-code', authController.loginByEmailCode);

/**
 * @route   POST /api/auth/login
 * @desc    使用账号密码登录
 * @access  Public（无需登录）
 */
router.post('/login', authController.loginByPassword);

/**
 * @route   POST /api/auth/register
 * @desc    注册新用户
 * @access  Public（无需登录）
 */
router.post('/register', authController.register);

/**
 * @route   GET /api/auth/me
 * @desc    获取当前登录用户信息
 * @access  Private（需要登录）
 */
router.get('/me', authMiddleware, authController.getCurrentUser);

module.exports = router;
