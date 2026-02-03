/**
 * API配置文件
 * 定义后端API的基础地址和端点
 */

// 后端API基础地址
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// API端点定义
export const API_ENDPOINTS = {
  // 认证相关
  AUTH: {
    SEND_CODE: '/api/auth/send-code',           // 发送验证码
    LOGIN_BY_CODE: '/api/auth/login-by-code',   // 验证码登录
    LOGIN: '/api/auth/login',                   // 账号密码登录
    REGISTER: '/api/auth/register',             // 注册
    ME: '/api/auth/me',                         // 获取当前用户信息
  },
  
  // 评分相关
  RATINGS: {
    CREATE: '/api/ratings',                     // 创建评分
    LIST: '/api/ratings',                       // 获取评分列表
    DETAIL: (id) => `/api/ratings/${id}`,       // 获取评分详情
    STATISTICS: '/api/ratings/statistics',      // 获取统计数据
    CHECK: (orderNo) => `/api/ratings/check/${orderNo}`, // 检查是否已评分
    REPLY: (id) => `/api/ratings/${id}/reply`,  // 添加回复
    REPLIES: (id) => `/api/ratings/${id}/replies`, // 获取回复列表
  }
};

// 请求配置
export const REQUEST_CONFIG = {
  timeout: 30000,  // 请求超时时间（毫秒）
  withCredentials: false, // 是否携带Cookie
};
