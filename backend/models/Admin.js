/**
 * 管理员数据模型
 * employee_id 字段用于存储外部系统的 ManageId，作为关联键
 */

const { query } = require('../config/database');

class Admin {
  /**
   * 根据外部 ManageId 查找或创建管理员（upsert）
   * @param {string|number} manageId - 外部系统的 ManageId
   * @param {string} manageName     - 外部系统的 ManageUserName
   * @returns {Object} - 本地 admins 表记录（含 id）
   */
  static async upsertByExternalId(manageId, manageName) {
    const extId = String(manageId);

    // 先查是否已存在
    const existing = await query(
      'SELECT * FROM admins WHERE employee_id = ? LIMIT 1',
      [extId]
    );

    if (existing && existing.length > 0) {
      const admin = existing[0];
      // 名字有变化则更新
      if (admin.name !== manageName) {
        await query('UPDATE admins SET name = ? WHERE id = ?', [manageName, admin.id]);
        admin.name = manageName;
      }
      return admin;
    }

    // 不存在则创建
    const result = await query(
      `INSERT INTO admins (name, employee_id, status) VALUES (?, ?, 1) RETURNING id`,
      [manageName, extId]
    );
    const id = result && result[0] ? result[0].id : null;
    console.log(`✅ 自动创建管理员: ${manageName} (ManageId=${extId}, 本地id=${id})`);
    return { id, name: manageName, employee_id: extId, status: 1 };
  }

  /**
   * 根据本地 ID 查找管理员
   */
  static async findById(id) {
    const result = await query('SELECT * FROM admins WHERE id = ? LIMIT 1', [id]);
    return result && result[0] ? result[0] : null;
  }
}

module.exports = Admin;
