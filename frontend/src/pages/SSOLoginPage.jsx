/**
 * SSO免登录跳转页面
 * 处理从现有网站跳转过来的自动登录
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Spin, Result, Button } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import request from '../utils/request';
import { setItem, STORAGE_KEYS } from '../utils/storage';

function SSOLoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    handleAutoLogin();
  }, []);

  /**
   * 处理自动登录
   */
  const handleAutoLogin = async () => {
    try {
      // 1. 获取URL参数
      const email = searchParams.get('email');
      const orderNo = searchParams.get('orderNo');
      const timestamp = searchParams.get('timestamp');
      const sign = searchParams.get('sign');

      // 2. 验证参数
      if (!email || !timestamp || !sign) {
        setStatus('error');
        setErrorMessage('Incomplete redirect parameters. Please try again from the website.');
        return;
      }

      // 3. 调用自动登录接口
      const response = await request.get('/api/sso/auto-login', {
        params: { email, orderNo, timestamp, sign }
      });

      if (response.success) {
        // 4. 保存Token和用户信息
        setItem(STORAGE_KEYS.TOKEN, response.data.token);
        setItem(STORAGE_KEYS.USER, response.data.user);

        setStatus('success');

        // 5. 跳转到评分页面
        setTimeout(() => {
          if (response.data.orderNo) {
            // 如果有订单号，跳转到评分页面并自动填入订单号
            navigate(`/rating?orderNo=${response.data.orderNo}`);
          } else {
            // 没有订单号，跳转到评分页面首页
            navigate('/rating');
          }
        }, 1000);
      } else {
        setStatus('error');
        setErrorMessage(response.message || 'Auto login failed');
      }

    } catch (error) {
      console.error('自动登录错误:', error);
      setStatus('error');
      setErrorMessage(error.response?.data?.message || 'Auto login failed. Please try again.');
    }
  };

  /**
   * 手动跳转到登录页
   */
  const goToLogin = () => {
    navigate('/login');
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: '#f0f2f5'
    }}>
      {status === 'loading' && (
        <div style={{ textAlign: 'center' }}>
          <Spin 
            indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} 
            size="large"
          />
          <div style={{ marginTop: 24, fontSize: 16, color: '#666' }}>
            Verifying your identity, please wait...
          </div>
        </div>
      )}

      {status === 'success' && (
        <Result
          status="success"
          title="Verification successful!"
          subTitle="Redirecting to rating page..."
        />
      )}

      {status === 'error' && (
        <Result
          status="error"
          title="Verification failed"
          subTitle={errorMessage}
          extra={
            <Button type="primary" onClick={goToLogin}>
              Back to Login
            </Button>
          }
        />
      )}
    </div>
  );
}

export default SSOLoginPage;
