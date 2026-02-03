/**
 * SSO单点登录路由
 * 处理从现有网站的免登录跳转
 */

const express = require('express');
const router = express.Router();
const ssoController = require('../controllers/ssoController');

/**
 * @route   GET /api/sso/auto-login
 * @desc    免登录自动登录接口
 * @access  Public（不需要登录，但需要验证签名）
 * @params  email, orderNo, timestamp, sign
 */
router.get('/auto-login', ssoController.autoLogin);

module.exports = router;
