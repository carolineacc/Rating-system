/**
 * 评分页面（用户端）
 * 用户对订单进行评分和评价，支持展示真实订单详情
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Layout,
  Card,
  Form,
  Input,
  Rate,
  Button,
  message,
  Space,
  Typography,
  Divider,
  Tag,
  Alert,
  Spin,
  Descriptions,
  Image,
  Badge
} from 'antd';
import { StarOutlined, LogoutOutlined, ShoppingOutlined, SearchOutlined } from '@ant-design/icons';
import { createRating, checkRated } from '../services/ratingService';
import { getLocalUser, logout } from '../services/authService';
import request from '../utils/request';
import { API_ENDPOINTS } from '../config/api';

const { Header, Content } = Layout;
const { TextArea } = Input;
const { Title, Text, Link } = Typography;

// 订单状态对应的 Badge 颜色
const STATUS_COLOR = {
  'Received': 'success',
  'Shipped': 'processing',
  'All Payment Received': 'processing',
  'Waiting for Payment': 'warning',
  'Cancelled': 'error'
};

function RatingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [checkingRated, setCheckingRated] = useState(false);

  // 订单详情状态
  const [orderInfo, setOrderInfo] = useState(null);       // 从 SSO 传来的订单信息缓存
  const [orderDetail, setOrderDetail] = useState(null);   // 从后端 API 拉取的完整订单
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState(null);

  const orderNo = searchParams.get('orderNo');
  const user = getLocalUser();

  useEffect(() => {
    // 尝试从 sessionStorage 读取 SSO 传来的订单信息
    const cached = sessionStorage.getItem('sso_order_info');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.orderNo === orderNo) {
          setOrderInfo(parsed);
        }
      } catch (_) {}
    }

    if (orderNo) {
      checkOrderRated();
      fetchOrderDetail(orderNo);
    }
  }, [orderNo]);

  const checkOrderRated = async () => {
    try {
      setCheckingRated(true);
      const response = await checkRated(orderNo);
      setHasRated(response.data.hasRated);
    } catch (_) {
    } finally {
      setCheckingRated(false);
    }
  };

  const fetchOrderDetail = async (no) => {
    try {
      setOrderLoading(true);
      setOrderError(null);
      const res = await request.get(API_ENDPOINTS.ORDERS.DETAIL(no));
      if (res.success) {
        setOrderDetail(res.data);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load order details.';
      setOrderError(msg);
    } finally {
      setOrderLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    message.success('Logged out successfully');
    navigate('/login');
  };

  const handleSubmit = async (values) => {
    if (!values.orderNo) {
      message.warning('Please enter order number');
      return;
    }

    // 如果订单信息显示不允许评分（状态不符合），给出提示
    if (orderDetail && !orderDetail.canRate) {
      message.warning(`Order status is "${orderDetail.status}". Only paid or shipped orders can be rated.`);
      return;
    }

    try {
      setLoading(true);
      await createRating({
        orderNo: values.orderNo,
        overallScore: values.overallScore,
        serviceAttitude: values.serviceAttitude,
        responseSpeed: values.responseSpeed,
        problemSolving: values.problemSolving,
        professionalism: values.professionalism,
        comment: values.comment || '',
        isAnonymous: 0
      });

      message.success('Rating submitted successfully. Thank you for your feedback!');
      form.resetFields();
      sessionStorage.removeItem('sso_order_info');

      if (orderNo) checkOrderRated();
    } catch (_) {
    } finally {
      setLoading(false);
    }
  };

  // 手动输入订单号后查询
  const handleOrderSearch = () => {
    const no = form.getFieldValue('orderNo');
    if (!no) { message.warning('Please enter order number first'); return; }
    checkRated(no).then(r => setHasRated(r.data.hasRated)).catch(() => {});
    fetchOrderDetail(no);
  };

  // 渲染订单详情卡片
  const renderOrderCard = () => {
    if (!orderNo && !orderDetail) return null;

    if (orderLoading) {
      return (
        <Card style={{ marginBottom: 16 }}>
          <Spin tip="Loading order details..." />
        </Card>
      );
    }

    if (orderError) {
      return (
        <Alert
          message="Order Not Found"
          description={orderError}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      );
    }

    if (!orderDetail) return null;

    const statusColor = STATUS_COLOR[orderDetail.status] || 'default';

    return (
      <Card
        title={<Space><ShoppingOutlined /><span>Order Details</span></Space>}
        style={{ marginBottom: 16 }}
        extra={<Badge status={statusColor} text={orderDetail.status} />}
      >
        <Descriptions column={2} size="small">
          <Descriptions.Item label="Order No.">{orderDetail.orderNo}</Descriptions.Item>
          <Descriptions.Item label="Order Date">{orderDetail.orderTime || '—'}</Descriptions.Item>
          <Descriptions.Item label="Payment">{orderDetail.paymentMethod || '—'}</Descriptions.Item>
          <Descriptions.Item label="Total">
            {orderDetail.currency} {orderDetail.totalPrice}
          </Descriptions.Item>
        </Descriptions>

        {orderDetail.products?.length > 0 && (
          <>
            <Divider orientation="left" style={{ fontSize: 13 }}>Products</Divider>
            {orderDetail.products.map((p, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 8 }}>
                {p.image && (
                  <Image
                    src={p.image}
                    width={60}
                    height={60}
                    style={{ objectFit: 'cover', borderRadius: 4, flexShrink: 0 }}
                    fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                  />
                )}
                <div>
                  {p.url ? (
                    <Link href={p.url} target="_blank">{p.name}</Link>
                  ) : (
                    <Text>{p.name}</Text>
                  )}
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Qty: {p.qty} &nbsp;·&nbsp; {orderDetail.currency} {p.price}
                    {p.sku && <> &nbsp;·&nbsp; SKU: {p.sku}</>}
                  </Text>
                </div>
              </div>
            ))}
          </>
        )}

        {!orderDetail.canRate && (
          <Alert
            message={`This order (${orderDetail.status}) is not eligible for rating yet.`}
            type="info"
            showIcon
            style={{ marginTop: 8 }}
          />
        )}
      </Card>
    );
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
          <StarOutlined /> Order Rating System
        </Title>
        <Space>
          <Text>Welcome, {user?.username || user?.email}</Text>
          <Button icon={<LogoutOutlined />} onClick={handleLogout}>Logout</Button>
        </Space>
      </Header>

      <Content style={{ padding: '24px', background: '#f0f2f5' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>

          {/* 已评分提示 */}
          {orderNo && hasRated && !checkingRated && (
            <Alert
              message="This order has been rated"
              description="Each order can only be rated once. You have already submitted a rating for this order."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          {/* 订单详情卡片 */}
          {renderOrderCard()}

          {/* 评分表单 */}
          <Card>
            <Title level={4}>Order Review</Title>
            <Text type="secondary">Your feedback is very important to us. Please rate honestly.</Text>

            <Divider />

            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{
                orderNo: orderNo || '',
                overallScore: 5,
                serviceAttitude: 5,
                responseSpeed: 5,
                problemSolving: 5,
                professionalism: 5
              }}
              disabled={orderNo && hasRated}
            >
              {/* 订单号 */}
              <Form.Item
                label="Order Number"
                name="orderNo"
                rules={[{ required: true, message: 'Please enter order number' }]}
              >
                <Input.Search
                  placeholder="Please enter order number"
                  size="large"
                  disabled={!!orderNo}
                  enterButton={<SearchOutlined />}
                  onSearch={handleOrderSearch}
                />
              </Form.Item>

              {/* 总体评分 */}
              <Form.Item
                label={
                  <Space>
                    <span>Overall Rating</span>
                    <Tag color="red">Required</Tag>
                  </Space>
                }
                name="overallScore"
                rules={[{ required: true, message: 'Please give an overall rating' }]}
              >
                <Rate allowHalf style={{ fontSize: 32 }} />
              </Form.Item>

              <Divider orientation="left">Detailed Rating (Optional)</Divider>

              <Form.Item label="Service Attitude" name="serviceAttitude">
                <Rate allowHalf />
              </Form.Item>

              <Form.Item label="Response Speed" name="responseSpeed">
                <Rate allowHalf />
              </Form.Item>

              <Form.Item label="Problem-solving Ability" name="problemSolving">
                <Rate allowHalf />
              </Form.Item>

              <Form.Item label="Professionalism" name="professionalism">
                <Rate allowHalf />
              </Form.Item>

              <Form.Item label="Review Content (Optional)" name="comment">
                <TextArea
                  rows={4}
                  placeholder="Please share your experience. Your feedback helps us improve our service..."
                  maxLength={1000}
                  showCount
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                  loading={loading}
                  disabled={orderNo && hasRated}
                >
                  {orderNo && hasRated ? 'Already Rated' : 'Submit Rating'}
                </Button>
              </Form.Item>

              <Alert
                message="Each order may only be rated once"
                description="Each order can only be rated once. Ratings cannot be modified after submission."
                type="warning"
                showIcon
              />
            </Form>
          </Card>
        </div>
      </Content>
    </Layout>
  );
}

export default RatingPage;
