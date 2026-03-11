/**
 * 管理员控制器
 * 提供管理员列表（用于后台筛选）
 */

const { query } = require('../config/database');

/**
 * 获取管理员列表
 * GET /api/admins
 * 需要管理员权限
 */
async function getAdminList(req, res) {
  try {
    const sql = `
      SELECT id, name, email, department, employee_id, status, created_at
      FROM admins
      WHERE status = 1
      ORDER BY name ASC, id ASC
    `;
    const list = await query(sql, []);

    return res.json({
      success: true,
      data: list
    });
  } catch (error) {
    console.error('获取管理员列表错误:', error);
    return res.status(500).json({
      success: false,
      message: '获取管理员列表失败'
    });
  }
}

module.exports = { getAdminList };

