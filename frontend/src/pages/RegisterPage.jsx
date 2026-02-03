/**
 * 注册页面
 * 用户注册新账号
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, message } from 'antd';
import { MailOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import { register } from '../services/authService';

function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  /**
   * 处理注册
   */
  const handleRegister = async (values) => {
    try {
      setLoading(true);
      await register({
        email: values.email,
        password: values.password,
        username: values.username
      });
      
      message.success('注册成功！');
      
      // 注册成功后跳转到评分页面
      setTimeout(() => {
        navigate('/rating');
      }, 1000);
    } catch (error) {
      // 错误已在request.js中处理
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="card-container">
        <h1 className="page-title">用户注册</h1>
        
        <Form
          name="register"
          onFinish={handleRegister}
          autoComplete="off"
          size="large"
        >
          {/* 邮箱 */}
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱地址' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input 
              prefix={<MailOutlined />} 
              placeholder="邮箱地址" 
            />
          </Form.Item>

          {/* 用户名 */}
          <Form.Item
            name="username"
            rules={[
              { required: false },
              { min: 2, max: 20, message: '用户名长度为2-20个字符' }
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="用户名（可选，默认使用邮箱前缀）" 
            />
          </Form.Item>

          {/* 密码 */}
          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码长度至少为6位' }
            ]}
            hasFeedback
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码（至少6位）"
            />
          </Form.Item>

          {/* 确认密码 */}
          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            hasFeedback
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="确认密码"
            />
          </Form.Item>

          {/* 提交按钮 */}
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              className="full-width-button"
              loading={loading}
            >
              注册
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center">
          <span>已有账号？</span>
          <Link to="/login" style={{ marginLeft: 8 }}>立即登录</Link>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
