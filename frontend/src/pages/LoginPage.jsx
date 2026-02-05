/**
 * 登录页面
 * 支持两种登录方式：1. 邮箱验证码登录  2. 账号密码登录
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, message, Tabs, Space } from 'antd';
import { MailOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { loginByEmailCode, loginByPassword, sendEmailCode, getLocalUser } from '../services/authService';

function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);

  /**
   * 发送验证码
   */
  const handleSendCode = async (email) => {
    if (!email) {
      message.warning('Please enter your email address first');
      return;
    }

    try {
      setSendingCode(true);
      await sendEmailCode(email);
      message.success('Verification code sent. Please check your email.');
      
      // 开始倒计时（60秒）
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      // 错误已在request.js中处理
    } finally {
      setSendingCode(false);
    }
  };

  /**
   * 邮箱验证码登录
   */
  const handleEmailCodeLogin = async (values) => {
    try {
      setLoading(true);
      await loginByEmailCode(values.email, values.code);
      message.success('Login successful');
      
      // 根据用户角色跳转到不同页面
      const user = getLocalUser();
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/rating');
      }
    } catch (error) {
      // 错误已在request.js中处理
    } finally {
      setLoading(false);
    }
  };

  /**
   * 账号密码登录
   */
  const handlePasswordLogin = async (values) => {
    try {
      setLoading(true);
      await loginByPassword(values.email, values.password);
      message.success('Login successful');
      
      // 根据用户角色跳转到不同页面
      const user = getLocalUser();
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/rating');
      }
    } catch (error) {
      // 错误已在request.js中处理
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="card-container">
        <h1 className="page-title">Rating System</h1>
        
        <Tabs
          defaultActiveKey="code"
          centered
          items={[
            {
              key: 'code',
              label: 'Verification Code',
              children: (
                // 邮箱验证码登录表单
                <Form
                  name="emailCodeLogin"
                  onFinish={handleEmailCodeLogin}
                  autoComplete="off"
                  size="large"
                >
                  <Form.Item
                    name="email"
                    rules={[
                      { required: true, message: 'Please enter email address' },
                      { type: 'email', message: 'Please enter a valid email address' }
                    ]}
                  >
                    <Input 
                      prefix={<MailOutlined />} 
                      placeholder="Email address" 
                    />
                  </Form.Item>

                  <Form.Item>
                    <Form.Item
                      name="code"
                      noStyle
                      rules={[{ required: true, message: 'Please enter verification code' }]}
                    >
                      <Input
                        prefix={<SafetyCertificateOutlined />}
                        placeholder="Verification code"
                        style={{ width: 'calc(100% - 120px)' }}
                      />
                    </Form.Item>
                    <Button
                      style={{ width: '110px', marginLeft: '10px' }}
                      onClick={() => {
                        const form = document.querySelector('input[placeholder="Email address"]');
                        handleSendCode(form?.value);
                      }}
                      loading={sendingCode}
                      disabled={countdown > 0}
                    >
                      {countdown > 0 ? `Resend in ${countdown}s` : 'Send Code'}
                    </Button>
                  </Form.Item>

                  <Form.Item>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      className="full-width-button"
                      loading={loading}
                    >
                      Log in
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
            {
              key: 'password',
              label: 'Password',
              children: (
                <Form
                  name="passwordLogin"
                  onFinish={handlePasswordLogin}
                  autoComplete="off"
                  size="large"
                >
                  <Form.Item
                    name="email"
                    rules={[
                      { required: true, message: 'Please enter email address' },
                      { type: 'email', message: 'Please enter a valid email address' }
                    ]}
                  >
                    <Input 
                      prefix={<MailOutlined />} 
                      placeholder="Email address" 
                    />
                  </Form.Item>

                  <Form.Item
                    name="password"
                    rules={[{ required: true, message: 'Please enter password' }]}
                  >
                    <Input.Password
                      prefix={<LockOutlined />}
                      placeholder="Password"
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      className="full-width-button"
                      loading={loading}
                    >
                      Log in
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
          ]}
        />

        {/* 注册功能已移除，对接现有网站账户系统 */}
      </div>
    </div>
  );
}

export default LoginPage;
