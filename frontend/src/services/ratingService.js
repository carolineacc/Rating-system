/**
 * 评分服务
 * 处理订单评分相关的API请求
 */

import request from '../utils/request';
import { API_ENDPOINTS } from '../config/api';

/**
 * 创建评分
 * @param {Object} ratingData - 评分数据
 * @param {string} ratingData.orderNo - 订单号（必填）
 * @param {number} ratingData.overallScore - 总体评分1-5（必填）
 * @param {number} ratingData.adminId - 管理员ID（可选）
 * @param {number} ratingData.serviceAttitude - 服务态度1-5（可选）
 * @param {number} ratingData.responseSpeed - 响应速度1-5（可选）
 * @param {number} ratingData.problemSolving - 问题解决能力1-5（可选）
 * @param {number} ratingData.professionalism - 专业程度1-5（可选）
 * @param {string} ratingData.comment - 评价内容（可选）
 * @param {Array<string>} ratingData.tags - 快捷标签（可选）
 * @param {number} ratingData.isAnonymous - 是否匿名（可选）
 * @param {Array<string>} ratingData.images - 图片URL（可选）
 * @returns {Promise} - API响应
 */
export async function createRating(ratingData) {
  return request.post(API_ENDPOINTS.RATINGS.CREATE, ratingData);
}

/**
 * 获取评分列表（管理员使用）
 * @param {Object} params - 查询参数
 * @param {number} params.adminId - 按管理员筛选（可选）
 * @param {number} params.userId - 按用户筛选（可选）
 * @param {number} params.minScore - 最低分筛选（可选）
 * @param {number} params.maxScore - 最高分筛选（可选）
 * @param {string} params.startDate - 开始日期（可选）
 * @param {string} params.endDate - 结束日期（可选）
 * @param {number} params.hasComment - 是否有评语（可选）
 * @param {number} params.page - 页码（默认1）
 * @param {number} params.pageSize - 每页数量（默认20）
 * @param {string} params.orderBy - 排序字段（默认created_at）
 * @param {string} params.orderDir - 排序方向（默认DESC）
 * @returns {Promise} - API响应，包含评分列表和分页信息
 */
export async function getRatingList(params = {}) {
  return request.get(API_ENDPOINTS.RATINGS.LIST, { params });
}

/**
 * 获取评分详情
 * @param {number} id - 评分ID
 * @returns {Promise} - API响应，包含评分详细信息
 */
export async function getRatingById(id) {
  return request.get(API_ENDPOINTS.RATINGS.DETAIL(id));
}

/**
 * 获取统计数据（管理员使用）
 * @param {Object} params - 查询参数
 * @param {number} params.adminId - 按管理员统计（可选）
 * @param {string} params.startDate - 开始日期（可选）
 * @param {string} params.endDate - 结束日期（可选）
 * @returns {Promise} - API响应，包含统计数据
 */
export async function getStatistics(params = {}) {
  return request.get(API_ENDPOINTS.RATINGS.STATISTICS, { params });
}

/**
 * 检查订单是否已评分
 * @param {string} orderNo - 订单号
 * @returns {Promise} - API响应，包含是否已评分的布尔值
 */
export async function checkRated(orderNo) {
  return request.get(API_ENDPOINTS.RATINGS.CHECK(orderNo));
}

/**
 * 添加回复（管理员使用）
 * @param {number} id - 评分ID
 * @param {string} replyContent - 回复内容
 * @returns {Promise} - API响应
 */
export async function addReply(id, replyContent) {
  return request.post(API_ENDPOINTS.RATINGS.REPLY(id), { replyContent });
}

/**
 * 获取回复列表
 * @param {number} id - 评分ID
 * @returns {Promise} - API响应，包含回复列表
 */
export async function getReplies(id) {
  return request.get(API_ENDPOINTS.RATINGS.REPLIES(id));
}
