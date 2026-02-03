/**
 * 本地存储工具
 * 封装localStorage操作，提供类型安全的存储方法
 */

/**
 * 保存数据到localStorage
 * @param {string} key - 键名
 * @param {any} value - 值（会自动转换为JSON字符串）
 */
export function setItem(key, value) {
  try {
    const jsonValue = JSON.stringify(value);
    localStorage.setItem(key, jsonValue);
  } catch (error) {
    console.error('保存数据失败:', error);
  }
}

/**
 * 从localStorage获取数据
 * @param {string} key - 键名
 * @param {any} defaultValue - 默认值（如果不存在则返回此值）
 * @returns {any} - 解析后的值
 */
export function getItem(key, defaultValue = null) {
  try {
    const jsonValue = localStorage.getItem(key);
    return jsonValue ? JSON.parse(jsonValue) : defaultValue;
  } catch (error) {
    console.error('读取数据失败:', error);
    return defaultValue;
  }
}

/**
 * 从localStorage删除数据
 * @param {string} key - 键名
 */
export function removeItem(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('删除数据失败:', error);
  }
}

/**
 * 清空localStorage
 */
export function clear() {
  try {
    localStorage.clear();
  } catch (error) {
    console.error('清空数据失败:', error);
  }
}

// 常用的键名常量
export const STORAGE_KEYS = {
  TOKEN: 'token',           // JWT Token
  USER: 'user',             // 用户信息
  THEME: 'theme',           // 主题设置
  LANGUAGE: 'language',     // 语言设置
};
