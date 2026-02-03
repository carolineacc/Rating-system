/**
 * 前端应用入口文件
 * 这是React应用的启动文件
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import 'dayjs/locale/zh-cn';
import App from './App';

// 渲染React应用到页面的#root元素
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* BrowserRouter: 提供路由功能 */}
    <BrowserRouter>
      {/* ConfigProvider: 配置Ant Design为中文 */}
      <ConfigProvider locale={zhCN}>
        <App />
      </ConfigProvider>
    </BrowserRouter>
  </React.StrictMode>
);
