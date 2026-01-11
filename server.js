const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRouter = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== 中间件配置 =====

// CORS 配置 - 允许所有来源访问 API
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// 解析 JSON 请求体
app.use(express.json());

// 解析 URL 编码的请求体
app.use(express.urlencoded({ extended: true }));

// 请求日志
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// ===== 静态文件服务 =====
app.use(express.static(path.join(__dirname)));

// ===== API 路由 =====
app.use('/api', apiRouter);

// ===== 根路径路由 =====
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ===== 错误处理中间件 =====
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    res.status(500).json({
        error: '服务器内部错误',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ===== 404 处理 =====
app.use((req, res) => {
    res.status(404).json({
        error: '未找到请求的资源',
        path: req.url
    });
});

// ===== 启动服务器 =====
app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log('🚀 FreeConvertor 订阅转换服务已启动');
    console.log('='.repeat(50));
    console.log(`📡 服务地址: http://localhost:${PORT}`);
    console.log(`📖 API 文档: http://localhost:${PORT}/api/health`);
    console.log(`🌐 前端界面: http://localhost:${PORT}`);
    console.log('='.repeat(50));
    console.log('');
    console.log('示例订阅 URL:');
    console.log(`http://localhost:${PORT}/api/convert?source_url=YOUR_YAML_URL&target_format=clash`);
    console.log('');
    console.log('支持的格式: clash, v2ray, shadowrocket');
    console.log('='.repeat(50));
});

// ===== 优雅关闭 =====
process.on('SIGTERM', () => {
    console.log('收到 SIGTERM 信号，优雅关闭服务器...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\n收到 SIGINT 信号，优雅关闭服务器...');
    process.exit(0);
});
