/**
 * 外部 API 服务
 * 封装对 showzstore.com 网关的调用：获取用户信息、获取订单信息
 */

const { generateSign } = require('../utils/signature');

const GATEWAY_URL = 'https://showzstore.com/gateway/';
const API_NUMBER = 'UPAD468';
const API_NAME = 'openapi';

/**
 * 调用外部网关接口（通用方法）
 * @param {string} action - 接口动作名，如 sync_get_user / sync_get_orders
 * @param {Object} params - 额外请求参数
 * @returns {Object} - 接口返回的原始数据
 */
async function callExternalApi(action, params = {}) {
  const timestamp = String(Math.floor(Date.now() / 1000));

  const requestData = {
    ApiName: API_NAME,
    Number: API_NUMBER,
    timestamp,
    Action: action,
    ...params
  };

  // 生成签名（在 sign 字段加入前计算）
  const sign = generateSign(requestData);
  requestData.sign = sign;

  // 转为 URL 编码格式（网关要求 form 提交）
  const body = new URLSearchParams(requestData).toString();

  const response = await fetch(GATEWAY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    signal: AbortSignal.timeout(15000) // 15秒超时
  });

  if (!response.ok) {
    throw new Error(`外部API请求失败: HTTP ${response.status}`);
  }

  return await response.json();
}

/**
 * 根据邮箱获取用户信息
 * @param {string} email - 用户邮箱
 * @returns {Object|null} - 用户信息，不存在返回 null
 */
async function getUserByEmail(email) {
  try {
    const result = await callExternalApi('sync_get_user', { Keyword: email });

    if (result.ret === 1 && result.msg?.UserData?.length > 0) {
      return result.msg.UserData[0];
    }
    return null;
  } catch (error) {
    console.error('获取用户信息失败:', error.message);
    return null;
  }
}

/**
 * 根据订单号获取订单详情
 * @param {string} orderNo - 订单号
 * @returns {Object|null} - 订单详情（含 orders / orders_products_list 等），不存在返回 null
 */
async function getOrderByNo(orderNo) {
  try {
    const result = await callExternalApi('sync_get_orders', { OrderNo: orderNo });

    if (result.ret === 1 && Array.isArray(result.msg) && result.msg.length > 0) {
      return result.msg[0]; // 返回第一条匹配记录
    }
    return null;
  } catch (error) {
    console.error('获取订单信息失败:', error.message);
    return null;
  }
}

/**
 * 将外部 API 的订单状态码转为可读文字
 * @param {string|number} status - 订单状态码
 * @param {boolean} isPresale - 是否预售订单
 * @returns {string}
 */
function formatOrderStatus(status, isPresale = false) {
  const statusNum = parseInt(status);
  if (isPresale) {
    const presaleMap = {
      1: 'Waiting for Deposit',
      2: 'Deposit Received',
      3: 'Waiting for Balance',
      4: 'All Payment Received',
      5: 'Shipped',
      6: 'Received',
      7: 'Cancelled'
    };
    return presaleMap[statusNum] || `Status ${statusNum}`;
  }
  const normalMap = {
    1: 'Waiting for Payment',
    2: 'Processing Payment',
    3: 'Payment Error',
    4: 'All Payment Received',
    5: 'Shipped',
    6: 'Received',
    7: 'Cancelled'
  };
  return normalMap[statusNum] || `Status ${statusNum}`;
}

module.exports = {
  getUserByEmail,
  getOrderByNo,
  formatOrderStatus
};
