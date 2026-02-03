/**
 * 主应用组件
 * 负责整个应用的路由配置和布局
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { isLoggedIn, getLocalUser } from './services/authService';

// 导入页面组件
import LoginPage from './pages/LoginPage';
// import RegisterPage from './pages/RegisterPage'; // 注册功能已移除
import SSOLoginPage from './pages/SSOLoginPage';
import RatingPage from './pages/RatingPage';
import AdminDashboard from './pages/AdminDashboard';
import NotFoundPage from './pages/NotFoundPage';

// 导入全局样式
import './App.css';

/**
 * 受保护的路由组件
 * 用于需要登录才能访问的页面
 * 如果未登录，自动跳转到登录页
 */
function ProtectedRoute({ children, requireAdmin = false }) {
  const loggedIn = isLoggedIn();
  const user = getLocalUser();
  
  // 未登录，跳转到登录页
  if (!loggedIn) {
    return <Navigate to="/login" replace />;
  }
  
  // 需要管理员权限但用户不是管理员
  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to="/rating" replace />;
  }
  
  return children;
}

/**
 * 主应用组件
 */
function App() {
  return (
    <div className="app">
      <Routes>
        {/* 根路径：根据登录状态跳转 */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* 登录页面 */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* SSO免登录跳转页面 */}
        <Route path="/sso" element={<SSOLoginPage />} />
        
        {/* 注册功能已移除 - 对接现有网站账户系统 */}
        
        {/* 评分页面（用户）- 需要登录 */}
        <Route 
          path="/rating" 
          element={
            <ProtectedRoute>
              <RatingPage />
            </ProtectedRoute>
          } 
        />
        
        {/* 管理后台（管理员）- 需要管理员权限 */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute requireAdmin={true}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* 404页面 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}

export default App;
