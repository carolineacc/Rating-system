/**
 * 认证服务
 * 处理用户登录、注册等认证相关的API请求
 */

import request from '../utils/request';
import { API_ENDPOINTS } from '../config/api';
import { setItem, getItem, removeItem, STORAGE_KEYS } from '../utils/storage';

/**
 * 发送邮箱验证码
 * @param {string} email - 邮箱地址
 * @returns {Promise} - API响应
 */
export async function sendEmailCode(email) {
  return request.post(API_ENDPOINTS.AUTH.SEND_CODE, { email });
}

/**
 * 使用邮箱验证码登录
 * @param {string} email - 邮箱地址
 * @param {string} code - 验证码
 * @returns {Promise} - API响应，包含token和用户信息
 */
export async function loginByEmailCode(email, code) {
  const response = await request.post(API_ENDPOINTS.AUTH.LOGIN_BY_CODE, {
    email,
    code
  });
  
  // 登录成功后保存Token和用户信息
  if (response.success) {
    setItem(STORAGE_KEYS.TOKEN, response.data.token);
    setItem(STORAGE_KEYS.USER, response.data.user);
  }
  
  return response;
}

/**
 * 使用账号密码登录
 * @param {string} email - 邮箱地址
 * @param {string} password - 密码
 * @returns {Promise} - API响应，包含token和用户信息
 */
export async function loginByPassword(email, password) {
  const response = await request.post(API_ENDPOINTS.AUTH.LOGIN, {
    email,
    password
  });
  
  // 登录成功后保存Token和用户信息
  if (response.success) {
    setItem(STORAGE_KEYS.TOKEN, response.data.token);
    setItem(STORAGE_KEYS.USER, response.data.user);
  }
  
  return response;
}

/**
 * 注册新用户
 * @param {Object} userData - 用户数据
 * @param {string} userData.email - 邮箱
 * @param {string} userData.password - 密码
 * @param {string} userData.username - 用户名（可选）
 * @returns {Promise} - API响应
 */
export async function register(userData) {
  const response = await request.post(API_ENDPOINTS.AUTH.REGISTER, userData);
  
  // 注册成功后自动登录
  if (response.success) {
    setItem(STORAGE_KEYS.TOKEN, response.data.token);
    setItem(STORAGE_KEYS.USER, response.data.user);
  }
  
  return response;
}

/**
 * 获取当前登录用户信息
 * @returns {Promise} - API响应，包含用户信息
 */
export async function getCurrentUser() {
  return request.get(API_ENDPOINTS.AUTH.ME);
}

/**
 * 登出
 * 清除本地存储的Token和用户信息
 */
export function logout() {
  removeItem(STORAGE_KEYS.TOKEN);
  removeItem(STORAGE_KEYS.USER);
}

/**
 * 检查是否已登录
 * @returns {boolean} - 是否已登录
 */
export function isLoggedIn() {
  return !!getItem(STORAGE_KEYS.TOKEN);
}

/**
 * 获取本地存储的用户信息
 * @returns {Object|null} - 用户信息对象或null
 */
export function getLocalUser() {
  return getItem(STORAGE_KEYS.USER);
}

/**
 * 获取本地存储的Token
 * @returns {string|null} - Token或null
 */
export function getLocalToken() {
  return getItem(STORAGE_KEYS.TOKEN);
}
