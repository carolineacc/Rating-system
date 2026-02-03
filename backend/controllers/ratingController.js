/**
 * 评分控制器
 * 处理订单评分、查看评分等业务逻辑
 */

const Rating = require('../models/Rating');
const config = require('../config/config');

/**
 * 创建评分
 * POST /api/ratings
 * 需要用户登录
 * 
 * 请求参数:
 * {
 *   "orderId": 1,              // 订单ID（可选，如果有orderNo可不传）
 *   "orderNo": "ORD123456",    // 订单号（必填）
 *   "adminId": 1,              // 被评价的管理员ID
 *   "overallScore": 5,         // 总体评分 1-5（必填）
 *   "serviceAttitude": 5,      // 服务态度 1-5（可选）
 *   "responseSpeed": 5,        // 响应速度 1-5（可选）
 *   "problemSolving": 5,       // 问题解决能力 1-5（可选）
 *   "professionalism": 5,      // 专业程度 1-5（可选）
 *   "comment": "服务很好",      // 评价内容（可选）
 *   "tags": ["态度好", "专业"], // 快捷标签（可选）
 *   "isAnonymous": 0,          // 是否匿名 0=否 1=是（可选）
 *   "images": ["url1", "url2"] // 图片URL数组（可选）
 * }
 * 
 * 响应:
 * {
 *   "success": true,
 *   "message": "评分提交成功",
 *   "data": { ... }
 * }
 */
async function createRating(req, res) {
  try {
    const {
      orderId,
      orderNo,
      adminId,
      overallScore,
      serviceAttitude,
      responseSpeed,
      problemSolving,
      professionalism,
      comment,
      tags,
      isAnonymous,
      images
    } = req.body;

    // 1. 验证必填参数
    if (!orderNo) {
      return res.status(400).json({
        success: false,
        message: '订单号不能为空'
      });
    }

    if (!overallScore) {
      return res.status(400).json({
        success: false,
        message: '总体评分不能为空'
      });
    }

    // 2. 验证评分范围
    const { minScore, maxScore } = config.rating;
    
    if (overallScore < minScore || overallScore > maxScore) {
      return res.status(400).json({
        success: false,
        message: `评分必须在${minScore}-${maxScore}之间`
      });
    }

    // 3. 检查是否已经评分过（每个订单只能评分一次）
    const hasRated = await Rating.hasRatedByOrderNo(orderNo, req.user.id);
    
    if (hasRated) {
      return res.status(400).json({
        success: false,
        message: '该订单已评分，每个订单只能评分一次'
      });
    }

    // 4. 验证评论长度
    if (comment && comment.length > config.rating.maxCommentLength) {
      return res.status(400).json({
        success: false,
        message: `评论内容不能超过${config.rating.maxCommentLength}字`
      });
    }

    // 5. 创建评分记录
    const ratingData = {
      orderId: orderId || null,
      orderNo,
      userId: req.user.id,
      adminId: adminId || null,
      overallScore,
      serviceAttitude,
      responseSpeed,
      problemSolving,
      professionalism,
      comment,
      tags,
      isAnonymous: isAnonymous || 0,
      images,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    };

    const rating = await Rating.create(ratingData);

    // 6. 返回成功响应
    return res.json({
      success: true,
      message: '评分提交成功，感谢您的反馈！',
      data: rating
    });

  } catch (error) {
    console.error('创建评分错误:', error);
    
    // 处理唯一键冲突（重复评分）
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: '该订单已评分，请勿重复提交'
      });
    }

    return res.status(500).json({
      success: false,
      message: '评分提交失败，请稍后重试'
    });
  }
}

/**
 * 获取评分列表（管理员使用）
 * GET /api/ratings
 * 需要管理员权限
 * 
 * 查询参数:
 * ?adminId=1               // 按管理员筛选
 * &userId=1                // 按用户筛选
 * &minScore=3              // 最低分筛选
 * &maxScore=5              // 最高分筛选
 * &startDate=2024-01-01    // 开始日期
 * &endDate=2024-12-31      // 结束日期
 * &hasComment=1            // 是否有评语（1=有，0=无）
 * &page=1                  // 页码
 * &pageSize=20             // 每页数量
 * &orderBy=created_at      // 排序字段
 * &orderDir=DESC           // 排序方向（DESC/ASC）
 * 
 * 响应:
 * {
 *   "success": true,
 *   "data": {
 *     "list": [...],
 *     "total": 100,
 *     "page": 1,
 *     "pageSize": 20,
 *     "totalPages": 5
 *   }
 * }
 */
async function getRatingList(req, res) {
  try {
    // 从查询参数中提取筛选条件
    const filters = {
      adminId: req.query.adminId ? parseInt(req.query.adminId) : undefined,
      userId: req.query.userId ? parseInt(req.query.userId) : undefined,
      minScore: req.query.minScore ? parseInt(req.query.minScore) : undefined,
      maxScore: req.query.maxScore ? parseInt(req.query.maxScore) : undefined,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      hasComment: req.query.hasComment !== undefined ? parseInt(req.query.hasComment) : undefined,
      page: req.query.page ? parseInt(req.query.page) : 1,
      pageSize: req.query.pageSize ? parseInt(req.query.pageSize) : 20,
      orderBy: req.query.orderBy || 'created_at',
      orderDir: req.query.orderDir || 'DESC'
    };

    // 获取评分列表
    const result = await Rating.getList(filters);

    return res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('获取评分列表错误:', error);
    return res.status(500).json({
      success: false,
      message: '获取评分列表失败'
    });
  }
}

/**
 * 获取单个评分详情
 * GET /api/ratings/:id
 * 需要登录
 * 
 * 响应:
 * {
 *   "success": true,
 *   "data": { ... }
 * }
 */
async function getRatingById(req, res) {
  try {
    const { id } = req.params;

    const rating = await Rating.getById(id);

    if (!rating) {
      return res.status(404).json({
        success: false,
        message: '评分不存在'
      });
    }

    // 如果是普通用户，只能查看自己的评分
    if (req.user.role !== 'admin' && rating.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权查看此评分'
      });
    }

    return res.json({
      success: true,
      data: rating
    });

  } catch (error) {
    console.error('获取评分详情错误:', error);
    return res.status(500).json({
      success: false,
      message: '获取评分详情失败'
    });
  }
}

/**
 * 获取统计数据
 * GET /api/ratings/statistics
 * 需要管理员权限
 * 
 * 查询参数:
 * ?adminId=1               // 按管理员统计
 * &startDate=2024-01-01    // 开始日期
 * &endDate=2024-12-31      // 结束日期
 * 
 * 响应:
 * {
 *   "success": true,
 *   "data": {
 *     "total_ratings": 100,        // 总评分数
 *     "avg_overall_score": 4.5,    // 平均总分
 *     "avg_service_attitude": 4.6, // 平均服务态度分
 *     "five_star_count": 60,       // 5星评分数量
 *     "four_star_count": 30,       // 4星评分数量
 *     ...
 *   }
 * }
 */
async function getStatistics(req, res) {
  try {
    const filters = {
      adminId: req.query.adminId ? parseInt(req.query.adminId) : undefined,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const statistics = await Rating.getStatistics(filters);

    return res.json({
      success: true,
      data: statistics
    });

  } catch (error) {
    console.error('获取统计数据错误:', error);
    return res.status(500).json({
      success: false,
      message: '获取统计数据失败'
    });
  }
}

/**
 * 添加回复（管理员回复用户评价）
 * POST /api/ratings/:id/reply
 * 需要管理员权限
 * 
 * 请求参数:
 * {
 *   "replyContent": "感谢您的反馈，我们会继续努力！"
 * }
 * 
 * 响应:
 * {
 *   "success": true,
 *   "message": "回复成功",
 *   "data": { ... }
 * }
 */
async function addReply(req, res) {
  try {
    const { id } = req.params;
    const { replyContent } = req.body;

    // 1. 验证回复内容
    if (!replyContent || replyContent.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: '回复内容不能为空'
      });
    }

    // 2. 检查评分是否存在
    const rating = await Rating.getById(id);
    
    if (!rating) {
      return res.status(404).json({
        success: false,
        message: '评分不存在'
      });
    }

    // 3. 添加回复
    const reply = await Rating.addReply(id, req.user.id, replyContent);

    return res.json({
      success: true,
      message: '回复成功',
      data: reply
    });

  } catch (error) {
    console.error('添加回复错误:', error);
    return res.status(500).json({
      success: false,
      message: '回复失败，请稍后重试'
    });
  }
}

/**
 * 获取评分的回复列表
 * GET /api/ratings/:id/replies
 * 需要登录
 * 
 * 响应:
 * {
 *   "success": true,
 *   "data": [...]
 * }
 */
async function getReplies(req, res) {
  try {
    const { id } = req.params;

    const replies = await Rating.getReplies(id);

    return res.json({
      success: true,
      data: replies
    });

  } catch (error) {
    console.error('获取回复列表错误:', error);
    return res.status(500).json({
      success: false,
      message: '获取回复列表失败'
    });
  }
}

/**
 * 检查订单是否已评分
 * GET /api/ratings/check/:orderNo
 * 需要用户登录
 * 
 * 响应:
 * {
 *   "success": true,
 *   "data": {
 *     "hasRated": true
 *   }
 * }
 */
async function checkRated(req, res) {
  try {
    const { orderNo } = req.params;

    const hasRated = await Rating.hasRatedByOrderNo(orderNo, req.user.id);

    return res.json({
      success: true,
      data: {
        hasRated
      }
    });

  } catch (error) {
    console.error('检查评分状态错误:', error);
    return res.status(500).json({
      success: false,
      message: '检查评分状态失败'
    });
  }
}

// 导出所有控制器函数
module.exports = {
  createRating,
  getRatingList,
  getRatingById,
  getStatistics,
  addReply,
  getReplies,
  checkRated
};
