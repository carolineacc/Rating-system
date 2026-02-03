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
    let errorMessage = '请求失败，请稍后重试';
    
    if (error.response) {
      // 服务器返回了错误响应
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          errorMessage = data.message || '请求参数错误';
          break;
        case 401:
          errorMessage = data.message || '未登录或登录已过期';
          // 清除Token并跳转到登录页
          removeItem(STORAGE_KEYS.TOKEN);
          removeItem(STORAGE_KEYS.USER);
          window.location.href = '/login';
          break;
        case 403:
          errorMessage = data.message || '没有权限访问';
          break;
        case 404:
          errorMessage = data.message || '请求的资源不存在';
          break;
        case 500:
          errorMessage = data.message || '服务器错误';
          break;
        default:
          errorMessage = data.message || `请求失败 (${status})`;
      }
    } else if (error.request) {
      // 请求已发出，但没有收到响应
      errorMessage = '网络连接失败，请检查网络';
    } else {
      // 请求配置出错
      errorMessage = error.message || '请求配置错误';
    }
    
    // 显示错误提示
    message.error(errorMessage);
    
    return Promise.reject(error);
  }
);

export default request;
