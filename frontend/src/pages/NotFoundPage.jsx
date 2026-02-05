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
        subTitle="Sorry, the page you visited does not exist."
        extra={
          <Button type="primary" onClick={() => navigate('/')}>
            Back to Home
          </Button>
        }
      />
    </div>
  );
}

export default NotFoundPage;
