/**
 * HTTP请求工具
 * 基于axios封装，统一处理请求和响应
 */

import axios from 'axios';
import { message } from 'antd';
import { API_BASE_URL, REQUEST_CONFIG } from '../config/api';
import { getItem, removeItem, STORAGE_KEYS } from './storage';

// 创建axios实例
const request = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_CONFIG.timeout,
  withCredentials: REQUEST_CONFIG.withCredentials,
  headers: {
    'Content-Type': 'application/json',
  }
});

/**
 * 请求拦截器
 * 在发送请求前执行，可以添加Token等
 */
request.interceptors.request.use(
  (config) => {
    // 从localStorage中获取Token（使用 getItem 会自动 JSON.parse）
    const token = getItem(STORAGE_KEYS.TOKEN);
    
    // 如果Token存在，添加到请求头
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

/**
 * 响应拦截器
 * 在收到响应后执行，统一处理错误
 */
request.interceptors.response.use(
  (response) => {
    // 直接返回响应数据
    return response.data;
  },
  (error) => {
    // 处理错误响应
    let errorMessage = 'Request failed. Please try again later.';
    
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          errorMessage = data.message || 'Invalid request parameters';
          break;
        case 401:
          errorMessage = data.message || 'Not logged in or session expired';
          removeItem(STORAGE_KEYS.TOKEN);
          removeItem(STORAGE_KEYS.USER);
          window.location.href = '/login';
          break;
        case 403:
          errorMessage = data.message || 'Access denied';
          break;
        case 404:
          errorMessage = data.message || 'Resource not found';
          break;
        case 500:
          errorMessage = data.message || 'Server error';
          break;
        default:
          errorMessage = data.message || `Request failed (${status})`;
      }
    } else if (error.request) {
      errorMessage = 'Network error. Please check your connection.';
    } else {
      errorMessage = error.message || 'Request configuration error';
    }
    
    // 显示错误提示
    message.error(errorMessage);
    
    return Promise.reject(error);
  }
);

export default request;
