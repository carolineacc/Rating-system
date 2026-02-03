/**
 * 评分页面（用户端）
 * 用户对订单进行评分和评价
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
import { StarOutlined, LogoutOutlined } from '@ant-design/icons';
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
  
  // 从URL参数获取订单号
  const orderNo = searchParams.get('orderNo');
  const user = getLocalUser();

  /**
   * 检查订单是否已评分
   */
  useEffect(() => {
    if (orderNo) {
      checkOrderRated();
    }
  }, [orderNo]);

  const checkOrderRated = async () => {
    try {
      setCheckingRated(true);
      const response = await checkRated(orderNo);
      setHasRated(response.data.hasRated);
    } catch (error) {
      // 错误已在request.js中处理
    } finally {
      setCheckingRated(false);
    }
  };

  /**
   * 处理登出
   */
  const handleLogout = () => {
    logout();
    message.success('已退出登录');
    navigate('/login');
  };

  /**
   * 提交评分
   */
  const handleSubmit = async (values) => {
    // 如果没有订单号，提示用户输入
    if (!values.orderNo) {
      message.warning('请输入订单号');
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

      message.success('评分提交成功，感谢您的反馈！');
      
      // 重置表单
      form.resetFields();
      
      // 如果是从URL带订单号进来的，重新检查评分状态
      if (orderNo) {
        checkOrderRated();
      }
    } catch (error) {
      // 错误已在request.js中处理
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 顶部导航栏 */}
      <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
          <StarOutlined /> 订单评分系统
        </Title>
        <Space>
          <Text>欢迎，{user?.username || user?.email}</Text>
          <Button icon={<LogoutOutlined />} onClick={handleLogout}>
            退出登录
          </Button>
        </Space>
      </Header>

      {/* 主要内容区域 */}
      <Content style={{ padding: '24px', background: '#f0f2f5' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          {/* 如果订单已评分，显示提示 */}
          {orderNo && hasRated && !checkingRated && (
            <Alert
              message="该订单已评分"
              description="每个订单只能评分一次，您已经对该订单进行过评价。"
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />
          )}

          <Card>
            <Title level={4}>订单评价</Title>
            <Text type="secondary">您的反馈对我们非常重要，请如实评价。</Text>
            
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
                label="订单号"
                name="orderNo"
                rules={[{ required: true, message: '请输入订单号' }]}
              >
                <Input 
                  placeholder="请输入订单号" 
                  size="large"
                  disabled={!!orderNo}
                />
              </Form.Item>

              {/* 总体评分 - 必填 */}
              <Form.Item
                label={
                  <Space>
                    <span>总体评分</span>
                    <Tag color="red">必填</Tag>
                  </Space>
                }
                name="overallScore"
                rules={[{ required: true, message: '请进行总体评分' }]}
              >
                <Rate allowHalf style={{ fontSize: 32 }} />
              </Form.Item>

              {/* 详细评分维度 - 可选 */}
              <Divider orientation="left">详细评分（可选）</Divider>

              <Form.Item label="服务态度" name="serviceAttitude">
                <Rate allowHalf />
              </Form.Item>

              <Form.Item label="响应速度" name="responseSpeed">
                <Rate allowHalf />
              </Form.Item>

              <Form.Item label="问题解决能力" name="problemSolving">
                <Rate allowHalf />
              </Form.Item>

              <Form.Item label="专业程度" name="professionalism">
                <Rate allowHalf />
              </Form.Item>

              {/* 评价内容 - 可选 */}
              <Form.Item
                label="评价内容（可选）"
                name="comment"
              >
                <TextArea
                  rows={4}
                  placeholder="请分享您的使用体验，您的反馈将帮助我们提升服务质量..."
                  maxLength={1000}
                  showCount
                />
              </Form.Item>

              {/* 提交按钮 */}
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                  loading={loading}
                  disabled={orderNo && hasRated}
                >
                  {orderNo && hasRated ? '该订单已评分' : '提交评分'}
                </Button>
              </Form.Item>

              {/* 提示文字 */}
              <Alert
                message="Each order may only be rated once"
                description="每个订单仅可评分一次，提交后无法修改。"
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
