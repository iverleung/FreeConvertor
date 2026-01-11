# FreeConvertor

<div align="center">

![FreeConvertor](https://img.shields.io/badge/FreeConvertor-v1.0.0-blue)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-green)
![License](https://img.shields.io/badge/license-MIT-orange)

**免费的代理订阅链接转换工具**

实在忍受不了某个服务商糟糕的、不可访问的转换服务，于是有了这个项目。

将 YAML 格式的代理配置转换为 Clash、V2Ray、Shadowrocket 等多种客户端格式

[在线演示](#) • [快速开始](#快速开始) • [API 文档](#api-文档) • [部署指南](DEPLOYMENT.md)

</div>

---

## ✨ 功能特性

- 🎨 **现代化界面** - 精美的深色主题设计，支持响应式布局
- 🔄 **多格式支持** - Clash、V2Ray、Shadowrocket 等主流客户端
- 🔐 **多协议兼容** - SS、SSR、VMess、Trojan、Vless 等代理协议
- 📡 **订阅模式** - 生成订阅 URL，客户端可定期自动更新
- 🚀 **快速可靠** - 使用简单的 wget 风格请求头，成功率高
- 🔒 **安全第一** - 启用严格的 SSL 证书验证
- 💻 **易于部署** - 支持 Vercel、Zeabur 等平台一键部署

## 🎯 支持的格式

### 输出格式
- **Clash** - Clash、Clash for Windows、ClashX、Clash for Android
- **V2Ray** - V2RayN、V2RayNG（Base64 订阅格式）
- **Shadowrocket** - iOS Shadowrocket

### 支持的协议
- Shadowsocks (ss://)
- ShadowsocksR (ssr://)
- VMess (vmess://)
- Trojan (trojan://)
- Vless (vless://)

## 🚀 快速开始

### 本地运行

```bash
# 克隆项目
git clone https://github.com/YOUR_USERNAME/FreeConvertor.git
cd FreeConvertor

# 安装依赖
npm install

# 启动服务
npm start
```

访问 http://localhost:3000

### 一键部署

#### Vercel 部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/FreeConvertor)

#### Zeabur 部署

[![Deploy on Zeabur](https://zeabur.com/button.svg)](https://zeabur.com)

详细部署说明请查看 [DEPLOYMENT.md](DEPLOYMENT.md)

## 📖 使用方式

### 方式一：Web 界面

1. 访问服务地址
2. 选择输入方式（URL 或直接粘贴）
3. 输入 YAML 配置 URL 或粘贴内容
4. 选择目标格式
5. 点击转换
6. 复制结果或下载配置文件

### 方式二：API 订阅

直接在代理客户端中使用订阅 URL：

```
https://your-domain.com/api/convert?source_url=YOUR_YAML_URL&target_format=clash
```

**参数说明：**
- `source_url` - 源 YAML 配置文件的 URL（需 URL 编码）
- `target_format` - 目标格式：`clash` / `v2ray` / `shadowrocket`

## 🔌 API 文档

### GET /api/convert

转换代理配置格式

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| source_url | string | 是 | 源 YAML 配置 URL（需 URL 编码） |
| target_format | string | 是 | 目标格式：clash / v2ray / shadowrocket |

**示例：**

```bash
# Clash 格式
curl "https://your-domain.com/api/convert?source_url=https%3A%2F%2Fexample.com%2Fconfig.yaml&target_format=clash"

# V2Ray 格式
curl "https://your-domain.com/api/convert?source_url=https%3A%2F%2Fexample.com%2Fconfig.yaml&target_format=v2ray"
```

### GET /api/health

健康检查端点

**响应：**
```json
{
  "status": "ok",
  "timestamp": "2026-01-11T18:00:00.000Z",
  "version": "1.0.0"
}
```

## 📁 项目结构

```
FreeConvertor/
├── index.html          # 前端界面
├── index.css           # 样式文件
├── app.js              # 前端逻辑
├── server.js           # Express 服务器
├── package.json        # 项目配置
├── vercel.json         # Vercel 部署配置
├── routes/
│   └── api.js          # API 路由
├── utils/
│   └── converter.js    # 转换核心逻辑
├── DEPLOYMENT.md       # 部署指南
└── README.md           # 项目文档
```

## 🛠️ 技术栈

- **后端**: Node.js + Express
- **前端**: 原生 JavaScript + CSS
- **依赖**: js-yaml, axios, cors

## 🔧 环境变量

```bash
NODE_ENV=production    # 运行环境
PORT=3000             # 服务端口（部署平台会自动设置）
```

## 📝 更新日志

### v1.0.0 (2026-01-12)
- ✨ 初始版本发布
- 🎨 现代化深色主题界面
- 🔄 支持 Clash、V2Ray、Shadowrocket 格式
- 🔐 支持多种代理协议
- 📡 订阅模式支持
- 🔒 安全的证书验证

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## ⚠️ 免责声明

本项目仅供学习和研究使用，请遵守当地法律法规。使用本工具产生的任何后果由使用者自行承担。

---

<div align="center">

**如果这个项目对您有帮助，请给个 ⭐️ Star！**

Made with ❤️ by FreeConvertor

</div>
