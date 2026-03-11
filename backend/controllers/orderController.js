/**
 * 订单控制器
 * 通过外部 API 查询订单详情，用于评分页展示订单信息
 */

const { getOrderByNo, formatOrderStatus } = require('../services/externalApiService');

/**
 * 根据订单号获取订单详情
 * GET /api/orders/:orderNo
 * 需要用户登录
 */
async function getOrderDetails(req, res) {
  try {
    const { orderNo } = req.params;

    if (!orderNo) {
      return res.status(400).json({ success: false, message: '订单号不能为空' });
    }

    const orderData = await getOrderByNo(orderNo);

    if (!orderData) {
      return res.status(404).json({
        success: false,
        message: 'Order not found. Please check the order number.'
      });
    }

    const o = orderData.orders;

    // 验证订单归属（订单邮箱必须与当前登录用户一致）
    if (o.Email && o.Email.toLowerCase() !== req.user.email.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: 'This order does not belong to your account.'
      });
    }

    // 判断订单状态是否允许评分（状态 4=已付清/已付款、5=已发货、6=已收货）
    const rateableStatuses = ['4', '5', '6'];
    const canRate = rateableStatuses.includes(String(o.OrderStatus));

    const products = (orderData.orders_products_list || []).map(p => ({
      name: p.Name,
      sku: p.SKU,
      qty: p.Qty,
      price: p.Price,
      image: p.PicPath,
      url: p.ProductsUrl
    }));

    return res.json({
      success: true,
      data: {
        orderNo: o.OId,
        email: o.Email,
        status: formatOrderStatus(o.OrderStatus, o.IsPresale === '1'),
        statusCode: o.OrderStatus,
        canRate,
        isPresale: o.IsPresale === '1',
        totalPrice: o.OrderTotalPrice,
        currency: o.Currency,
        paymentMethod: o.PaymentMethod,
        orderTime: o.OrderTime ? new Date(parseInt(o.OrderTime) * 1000).toLocaleDateString('en-US') : null,
        products
      }
    });

  } catch (error) {
    console.error('获取订单详情错误:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch order details. Please try again.'
    });
  }
}

module.exports = { getOrderDetails };
