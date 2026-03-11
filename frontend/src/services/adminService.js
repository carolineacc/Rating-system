/**
 * 管理员服务
 * 获取管理员列表（用于后台筛选）
 */

import request from '../utils/request';
import { API_ENDPOINTS } from '../config/api';

export async function getAdminList() {
  return request.get(API_ENDPOINTS.ADMINS.LIST);
}

