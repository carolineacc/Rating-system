/**
 * 评分数据模型
 * 处理评分相关的数据库操作
 */

const { query } = require('../config/database');

class Rating {
  /**
   * 创建评分
   * @param {Object} ratingData - 评分数据
   * @returns {Object} - 创建的评分信息
   */
  static async create(ratingData) {
    const {
      orderId,
      orderNo,
      userId,
      adminId,
      overallScore,
      serviceAttitude,
      responseSpeed,
      problemSolving,
      professionalism,
      comment,
      tags,
      isAnonymous = 0,
      images,
      ipAddress,
      userAgent
    } = ratingData;

    // PostgreSQL 使用 RETURNING 获取插入的 id（MySQL 用 result.insertId）
    const sql = `
      INSERT INTO ratings (
        order_id, order_no, user_id, admin_id,
        overall_score, service_attitude, response_speed, problem_solving, professionalism,
        comment, tags, is_anonymous, images, ip_address, user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING id
    `;

    const result = await query(sql, [
      orderId,
      orderNo,
      userId,
      adminId,
      overallScore,
      serviceAttitude || null,
      responseSpeed || null,
      problemSolving || null,
      professionalism || null,
      comment || null,
      tags ? JSON.stringify(tags) : null,
      isAnonymous,
      images ? JSON.stringify(images) : null,
      ipAddress,
      userAgent
    ]);

    const id = result && result[0] ? result[0].id : null;
    return {
      id,
      ...ratingData
    };
  }

  /**
   * 检查订单是否已被评分
   * @param {Number} orderId - 订单ID
   * @param {Number} userId - 用户ID
   * @returns {Boolean} - 是否已评分
   */
  static async hasRated(orderId, userId) {
    const sql = 'SELECT COUNT(*) as count FROM ratings WHERE order_id = ? AND user_id = ?';
    const result = await query(sql, [orderId, userId]);
    return result[0].count > 0;
  }

  /**
   * 根据订单号检查是否已评分
   * @param {String} orderNo - 订单号
   * @param {Number} userId - 用户ID
   * @returns {Boolean} - 是否已评分
   */
  static async hasRatedByOrderNo(orderNo, userId) {
    const sql = 'SELECT COUNT(*) as count FROM ratings WHERE order_no = ? AND user_id = ?';
    const result = await query(sql, [orderNo, userId]);
    const row = result && result[0];
    const count = row ? (typeof row.count === 'string' ? parseInt(row.count, 10) : row.count) : 0;
    return count > 0;
  }

  /**
   * 获取评分列表（带筛选和分页）
   * @param {Object} filters - 筛选条件
   * @returns {Object} - 评分列表和总数
   */
  static async getList(filters = {}) {
    try {
      // 简化版：直接查询所有数据，前端分页
      const listSql = `
        SELECT 
          r.*,
          u.username, u.email as user_email,
          a.name as admin_name, a.email as admin_email
        FROM ratings r
        LEFT JOIN users u ON r.user_id = u.id
        LEFT JOIN admins a ON r.admin_id = a.id
        ORDER BY r.created_at DESC
      `;

      const list = await query(listSql, []);

      // 处理JSON字段（PostgreSQL JSONB 可能已是对象，MySQL 是字符串）
      const processedList = list.map(item => ({
        ...item,
        tags: item.tags != null ? (typeof item.tags === 'string' ? JSON.parse(item.tags) : item.tags) : null,
        images: item.images != null ? (typeof item.images === 'string' ? JSON.parse(item.images) : item.images) : null
      }));

      return {
        list: processedList,
        total: processedList.length,
        page: 1,
        pageSize: processedList.length,
        totalPages: 1
      };
    } catch (error) {
      console.error('获取评分列表错误:', error);
      throw error;
    }
  }

  /**
   * 获取单个评分详情
   * @param {Number} id - 评分ID
   * @returns {Object|null} - 评分详情
   */
  static async getById(id) {
    const sql = `
      SELECT 
        r.*,
        u.username, u.email as user_email,
        a.name as admin_name, a.email as admin_email
      FROM ratings r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN admins a ON r.admin_id = a.id
      WHERE r.id = ?
      LIMIT 1
    `;

    const ratings = await query(sql, [id]);
    if (ratings.length === 0) return null;

    const rating = ratings[0];
    return {
      ...rating,
      tags: rating.tags != null ? (typeof rating.tags === 'string' ? JSON.parse(rating.tags) : rating.tags) : null,
      images: rating.images != null ? (typeof rating.images === 'string' ? JSON.parse(rating.images) : rating.images) : null
    };
  }

  /**
   * 获取统计数据
   * @param {Object} filters - 筛选条件
   * @returns {Object} - 统计数据
   */
  static async getStatistics(filters = {}) {
    const { adminId, startDate, endDate } = filters;

    const conditions = [];
    const params = [];

    if (adminId) {
      conditions.push('admin_id = ?');
      params.push(adminId);
    }

    if (startDate) {
      conditions.push('created_at >= ?');
      params.push(startDate);
    }

    if (endDate) {
      conditions.push('created_at <= ?');
      params.push(endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT 
        COUNT(*) as total_ratings,
        AVG(overall_score) as avg_overall_score,
        AVG(service_attitude) as avg_service_attitude,
        AVG(response_speed) as avg_response_speed,
        AVG(problem_solving) as avg_problem_solving,
        AVG(professionalism) as avg_professionalism,
        SUM(CASE WHEN overall_score = 5 THEN 1 ELSE 0 END) as five_star_count,
        SUM(CASE WHEN overall_score = 4 THEN 1 ELSE 0 END) as four_star_count,
        SUM(CASE WHEN overall_score = 3 THEN 1 ELSE 0 END) as three_star_count,
        SUM(CASE WHEN overall_score = 2 THEN 1 ELSE 0 END) as two_star_count,
        SUM(CASE WHEN overall_score = 1 THEN 1 ELSE 0 END) as one_star_count,
        SUM(CASE WHEN comment IS NOT NULL AND comment != '' THEN 1 ELSE 0 END) as with_comment_count
      FROM ratings
      ${whereClause}
    `;

    const result = await query(sql, params);
    return result[0];
  }

  /**
   * 添加回复
   * @param {Number} ratingId - 评分ID
   * @param {Number} adminId - 管理员ID
   * @param {String} replyContent - 回复内容
   * @returns {Object} - 回复信息
   */
  static async addReply(ratingId, adminId, replyContent) {
    // PostgreSQL 用 RETURNING 获取插入的 id
    const sql = `
      INSERT INTO rating_replies (rating_id, admin_id, reply_content) 
      VALUES (?, ?, ?)
      RETURNING id
    `;

    const result = await query(sql, [ratingId, adminId, replyContent]);

    // 更新评分表的回复状态
    await query('UPDATE ratings SET is_replied = 1 WHERE id = ?', [ratingId]);

    const id = result && result[0] ? result[0].id : null;
    return {
      id,
      ratingId,
      adminId,
      replyContent
    };
  }

  /**
   * 获取评分的回复列表
   * @param {Number} ratingId - 评分ID
   * @returns {Array} - 回复列表
   */
  static async getReplies(ratingId) {
    const sql = `
      SELECT 
        rr.*,
        a.name as admin_name
      FROM rating_replies rr
      LEFT JOIN admins a ON rr.admin_id = a.id
      WHERE rr.rating_id = ?
      ORDER BY rr.created_at ASC
    `;

    return await query(sql, [ratingId]);
  }
}

module.exports = Rating;
