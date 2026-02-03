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
      message.warning('请先输入邮箱地址');
      return;
    }

    try {
      setSendingCode(true);
      await sendEmailCode(email);
      message.success('验证码已发送，请查收邮件');
      
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
      message.success('登录成功');
      
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
      message.success('登录成功');
      
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
        <h1 className="page-title">评分系统</h1>
        
        <Tabs
          defaultActiveKey="code"
          centered
          items={[
            {
              key: 'code',
              label: '验证码登录',
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
                      { required: true, message: '请输入邮箱地址' },
                      { type: 'email', message: '请输入有效的邮箱地址' }
                    ]}
                  >
                    <Input 
                      prefix={<MailOutlined />} 
                      placeholder="邮箱地址" 
                    />
                  </Form.Item>

                  <Form.Item>
                    <Form.Item
                      name="code"
                      noStyle
                      rules={[{ required: true, message: '请输入验证码' }]}
                    >
                      <Input
                        prefix={<SafetyCertificateOutlined />}
                        placeholder="验证码"
                        style={{ width: 'calc(100% - 120px)' }}
                      />
                    </Form.Item>
                    <Button
                      style={{ width: '110px', marginLeft: '10px' }}
                      onClick={() => {
                        const form = document.querySelector('input[placeholder="邮箱地址"]');
                        handleSendCode(form?.value);
                      }}
                      loading={sendingCode}
                      disabled={countdown > 0}
                    >
                      {countdown > 0 ? `${countdown}秒后重发` : '发送验证码'}
                    </Button>
                  </Form.Item>

                  <Form.Item>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      className="full-width-button"
                      loading={loading}
                    >
                      登录
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
            {
              key: 'password',
              label: '密码登录',
              children: (
                // 账号密码登录表单
                <Form
                  name="passwordLogin"
                  onFinish={handlePasswordLogin}
                  autoComplete="off"
                  size="large"
                >
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

                  <Form.Item
                    name="password"
                    rules={[{ required: true, message: '请输入密码' }]}
                  >
                    <Input.Password
                      prefix={<LockOutlined />}
                      placeholder="密码"
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      className="full-width-button"
                      loading={loading}
                    >
                      登录
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
