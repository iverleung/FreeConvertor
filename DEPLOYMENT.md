# 部署指南

## 快速部署到 Vercel

### 方式一：通过 Vercel CLI（推荐）

1. **安装 Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **登录 Vercel**
   ```bash
   vercel login
   ```

3. **部署项目**
   ```bash
   cd FreeConvertor
   vercel
   ```

4. **跟随提示完成部署**
   - 选择项目设置
   - 确认配置
   - 等待部署完成

5. **获取部署 URL**
   ```
   ✅ 部署成功！
   🔗 https://your-project.vercel.app
   ```

### 方式二：通过 GitHub + Vercel Dashboard

1. **上传代码到 GitHub**
   ```bash
   cd FreeConvertor
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/FreeConvertor.git
   git push -u origin main
   ```

2. **连接 Vercel**
   - 访问 https://vercel.com
   - 点击 "New Project"
   - 导入你的 GitHub 仓库
   - 点击 "Deploy"

3. **配置环境变量（可选）**
   - 在 Vercel Dashboard 中设置环境变量
   - `NODE_ENV=production`
   - `PORT=3000`（Vercel 会自动设置）

### Vercel 部署注意事项

✅ **已配置：**
- `vercel.json` - Vercel 配置文件
- `.gitignore` - Git 忽略文件
- `package.json` - 包含正确的启动脚本

⚠️ **Vercel 限制：**
- 免费版有函数执行时间限制（10秒）
- 如果转换大文件可能超时
- 建议使用 Pro 版本或考虑其他平台

---

## 快速部署到 Zeabur

### 方式一：通过 Zeabur CLI

1. **安装 Zeabur CLI**
   ```bash
   npm install -g @zeabur/cli
   ```

2. **登录 Zeabur**
   ```bash
   zeabur auth login
   ```

3. **部署项目**
   ```bash
   # 安装依赖
   cd FreeConvertor
   npm install
   zeabur deploy
   ```

### 方式二：通过 GitHub + Zeabur Dashboard

1. **上传代码到 GitHub**（同上）

2. **连接 Zeabur**
   - 访问 https://zeabur.com
   - 创建新项目
   - 连接 GitHub 仓库
   - 选择 FreeConvertor 仓库
   - 点击部署

3. **配置环境变量（可选）**
   - 在 Zeabur Dashboard 中设置
   - `NODE_ENV=production`

### Zeabur 优势

✅ **优点：**
- 更灵活的定价
- 更长的函数执行时间
- 支持 WebSocket
- 国内访问速度较好

---

## 部署前检查清单

- [ ] 确保 `package.json` 中的 `start` 脚本正确
- [ ] 创建 `.gitignore` 文件
- [ ] 删除测试文件和临时文件
- [ ] 确认没有敏感信息（密钥、Token等）
- [ ] 测试本地运行正常：`npm start`

---

## 环境变量配置

部署时可以设置以下环境变量：

```bash
NODE_ENV=production
PORT=3000  # Vercel/Zeabur 会自动设置，通常不需要手动配置
```

---

## 部署后测试

部署成功后，测试以下端点：

1. **健康检查**
   ```bash
   curl https://your-domain.vercel.app/api/health
   ```

2. **转换测试**
   ```bash
   curl "https://your-domain.vercel.app/api/convert?source_url=YOUR_YAML_URL&target_format=clash"
   ```

3. **前端界面**
   访问 `https://your-domain.vercel.app`

---

## 自定义域名（可选）

### Vercel
1. 进入项目设置
2. 点击 "Domains"
3. 添加自定义域名
4. 配置 DNS 记录

### Zeabur
1. 进入项目设置
2. 点击 "Domains"
3. 添加自定义域名
4. 配置 DNS 记录

---

## 常见问题

### Q: 部署后返回 404
**A:** 检查 `vercel.json` 或路由配置是否正确

### Q: API 超时
**A:** 
- Vercel 免费版有 10 秒限制
- 考虑升级或使用 Zeabur
- 优化代码减少请求时间

### Q: 静态文件 404
**A:** 确保静态文件在项目根目录，Express 配置了静态文件服务

### Q: CORS 错误
**A:** 已在 `server.js` 中配置 CORS，应该不会有问题

---

## 监控和日志

### Vercel
- 在 Dashboard 中查看实时日志
- Analytics 功能查看访问统计

### Zeabur
- 在 Dashboard 中查看日志
- Metrics 查看性能指标

---

## 成本估算

### Vercel
- 免费版：适合个人使用
- Pro 版：$20/月（无函数时间限制）

### Zeabur
- 免费额度：每月一定量的免费资源
- 按用量付费：更灵活

---

## 推荐选择

**个人使用 + 轻量级：** Vercel 免费版  
**需要长时间执行：** Zeabur  
**生产环境：** Vercel Pro 或 Zeabur 付费版

---

## 下一步

1. ✅ 上传代码到 GitHub
2. ✅ 选择部署平台（Vercel 或 Zeabur）
3. ✅ 按照上述步骤部署
4. ✅ 测试功能
5. ✅ （可选）配置自定义域名

Happy Deploying! 🚀
