/**
 * Vite配置文件
 * Vite是现代化的前端构建工具，比传统的Webpack更快
 */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // 使用React插件
  plugins: [react()],
  
  // 开发服务器配置
  server: {
    port: 5173,        // 开发服务器端口
    open: true,        // 启动时自动打开浏览器
    cors: true,        // 允许跨域
    
    // 代理配置（将API请求转发到后端服务器）
    proxy: {
      '/api': {
        target: 'http://localhost:3000',  // 后端服务器地址
        changeOrigin: true,               // 改变请求源
        // rewrite: (path) => path.replace(/^\/api/, '') // 如果需要移除/api前缀
      }
    }
  },
  
  // 构建配置
  build: {
    outDir: 'dist',    // 输出目录
    sourcemap: false,  // 不生成sourcemap（减小文件大小）
    minify: 'esbuild',  // 使用terser压缩
  }
})

