const express = require('express');
const axios = require('axios');
const { parseYaml, convertConfig } = require('../utils/converter');

const router = express.Router();

/**
 * 转换 API 端点
 * GET /api/convert?source_url=xxx&target_format=clash
 */
router.get('/convert', async (req, res) => {
    try {
        const { source_url, target_format } = req.query;

        // 参数验证
        if (!source_url) {
            return res.status(400).json({
                error: '缺少参数 source_url'
            });
        }

        if (!target_format) {
            return res.status(400).json({
                error: '缺少参数 target_format'
            });
        }

        const validFormats = ['clash', 'v2ray', 'shadowrocket'];
        if (!validFormats.includes(target_format)) {
            return res.status(400).json({
                error: `不支持的格式: ${target_format}。支持的格式: ${validFormats.join(', ')}`
            });
        }

        // 获取源 YAML 配置
        console.log(`正在获取配置: ${source_url}`);

        const response = await axios.get(source_url, {
            timeout: 30000,
            headers: {
                // 模拟 wget 的简单请求头（关键：不要添加浏览器特有的头）
                'User-Agent': 'Wget/1.21.4',
                'Accept': '*/*',
                'Accept-Encoding': 'identity',
                'Connection': 'Keep-Alive'
            },
            // 自动处理重定向
            maxRedirects: 5,
            followRedirect: true,
            // 响应类型
            responseType: 'text',
            // 允许所有状态码
            validateStatus: function (status) {
                return status >= 200 && status < 600;
            }
        });

        const yamlContent = response.data;

        // 解析 YAML
        const config = parseYaml(yamlContent);
        console.log(`成功解析配置，包含 ${config.proxies.length} 个节点`);

        // 转换格式
        const result = convertConfig(config, target_format);

        // 设置响应头
        if (target_format === 'clash') {
            res.setHeader('Content-Type', 'text/yaml; charset=utf-8');
            res.setHeader('Content-Disposition', 'inline; filename="clash_config.yaml"');
            res.setHeader('Subscription-Userinfo', `upload=0; download=0; total=10737418240; expire=0`);
        } else {
            // V2Ray 和 Shadowrocket 使用 Base64 格式
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.setHeader('Subscription-Userinfo', `upload=0; download=0; total=10737418240; expire=0`);
        }

        // 返回结果
        res.send(result);

    } catch (error) {
        console.error('转换错误:', error.message);

        // 错误处理
        if (error.response) {
            // HTTP 请求错误
            return res.status(502).json({
                error: `无法获取源配置: HTTP ${error.response.status}`,
                details: error.message
            });
        } else if (error.code === 'ECONNABORTED') {
            // 超时错误
            return res.status(504).json({
                error: '请求超时，无法获取源配置',
                details: error.message
            });
        } else {
            // 其他错误
            return res.status(500).json({
                error: '转换失败',
                details: error.message
            });
        }
    }
});

/**
 * 专门用于获取 YAML 内容的端点（帮助前端绕过 CORS）
 * GET /api/fetch-yaml?url=xxx
 */
router.get('/fetch-yaml', async (req, res) => {
    try {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({
                error: '缺少参数 url'
            });
        }

        console.log(`获取 YAML: ${url}`);

        const response = await axios.get(url, {
            timeout: 30000,
            headers: {
                // 模拟 wget 的简单请求头
                'User-Agent': 'Wget/1.21.4',
                'Accept': '*/*',
                'Accept-Encoding': 'identity',
                'Connection': 'Keep-Alive'
            },
            maxRedirects: 5,
            followRedirect: true,
            validateStatus: function (status) {
                return status >= 200 && status < 600;
            },
            responseType: 'text'
        });

        // 检查状态码
        if (response.status >= 400) {
            return res.status(502).json({
                error: `源服务器返回错误: HTTP ${response.status}`,
                details: '该 URL 可能需要认证、已过期或有访问限制。请尝试使用"直接粘贴"方式。'
            });
        }

        // 检查内容是否为空
        if (!response.data || response.data.length === 0) {
            return res.status(502).json({
                error: '获取到的内容为空',
                details: '该 URL 可能已过期或需要特殊权限。请尝试使用"直接粘贴"方式。'
            });
        }

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.send(response.data);

    } catch (error) {
        console.error('获取 YAML 错误:', error.message);

        if (error.response) {
            return res.status(502).json({
                error: `无法获取配置: HTTP ${error.response.status}`,
                details: '建议：使用浏览器或 wget 下载配置后，选择"直接粘贴"方式。'
            });
        } else if (error.code === 'ECONNABORTED') {
            return res.status(504).json({
                error: '请求超时',
                details: error.message
            });
        } else {
            return res.status(500).json({
                error: '获取配置失败',
                details: error.message
            });
        }
    }
});

/**
 * 健康检查端点
 */
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

module.exports = router;
