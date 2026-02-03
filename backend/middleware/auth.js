/**
 * 认证中间件 - 验证用户是否已登录
 */

const { verifyToken, extractToken } = require('../utils/jwt');

/**
 * 验证JWT Token中间件
 * 使用方法: 在需要登录的路由前添加此中间件
 * 例如: router.get('/profile', authMiddleware, controller)
 */
function authMiddleware(req, res, next) {
  try {
    // 1. 从请求头中提取Token
    const token = extractToken(req);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '未提供认证令牌，请先登录'
      });
    }

    // 2. 验证Token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: '认证令牌无效或已过期，请重新登录'
      });
    }

    // 3. 将用户信息附加到请求对象上，后续中间件可以使用
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };

    // 4. 继续执行下一个中间件或路由处理器
    next();
  } catch (error) {
    console.error('认证中间件错误:', error);
    return res.status(500).json({
      success: false,
      message: '认证过程发生错误'
    });
  }
}

/**
 * 验证管理员权限中间件
 * 必须在 authMiddleware 之后使用
 */
function adminMiddleware(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: '权限不足，需要管理员权限'
    });
  }
  next();
}

/**
 * 可选认证中间件
 * 如果有Token就验证，没有Token也允许通过
 * 适用于某些既可以登录也可以不登录访问的接口
 */
function optionalAuthMiddleware(req, res, next) {
  try {
    const token = extractToken(req);
    
    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        req.user = {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role
        };
      }
    }
    
    next();
  } catch (error) {
    next();
  }
}

module.exports = {
  authMiddleware,
  adminMiddleware,
  optionalAuthMiddleware
};
