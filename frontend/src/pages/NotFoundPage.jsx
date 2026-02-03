/**
 * 404页面
 * 当用户访问不存在的路由时显示
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Result } from 'antd';

function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="page-container">
      <Result
        status="404"
        title="404"
        subTitle="抱歉，您访问的页面不存在"
        extra={
          <Button type="primary" onClick={() => navigate('/')}>
            返回首页
          </Button>
        }
      />
    </div>
  );
}

export default NotFoundPage;
