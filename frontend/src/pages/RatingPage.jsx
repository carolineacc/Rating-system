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
  Alert
} from 'antd';
import { StarOutlined, LogoutOutlined, SearchOutlined } from '@ant-design/icons';
import { createRating, checkRated } from '../services/ratingService';
import { getLocalUser, logout } from '../services/authService';
 

const { Header, Content } = Layout;
const { TextArea } = Input;
const { Title, Text } = Typography;

function RatingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [checkingRated, setCheckingRated] = useState(false);

  // SSO 上下文（订单号、管理员ID），用于把 adminId 一起提交到后端
  const [ssoContext, setSsoContext] = useState(null);

  const orderNo = searchParams.get('orderNo');
  const user = getLocalUser();

  useEffect(() => {
    // 尝试从 sessionStorage 读取 SSO 传来的上下文
    const cached = sessionStorage.getItem('sso_context');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setSsoContext(parsed);
      } catch (_) {}
    }

    if (orderNo) {
      checkOrderRated();
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

    try {
      setLoading(true);
      await createRating({
        orderNo: values.orderNo,
        adminId: ssoContext?.adminId || null,
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
      sessionStorage.removeItem('sso_context');

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
          {/* 不展示订单详情，仅保留评分功能 */}

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
