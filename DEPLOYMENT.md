# 部署指南

## 部署方式选择

| 方式 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| **VPS 自托管** | 完全控制、无限制、稳定 | 需要运维知识、成本较高 | 生产环境、大流量 |
| **Vercel** | 简单、免费额度、CDN 加速 | 函数时间限制（10秒） | 个人使用、轻量级 |
| **Zeabur** | 国内速度快、灵活定价 | 需付费 | 中小型项目 |

---

## 🖥️ 部署到自己的服务器（VPS）

### 前置要求

- 一台 VPS 服务器（Ubuntu 20.04+ / CentOS 7+ / Debian 10+）
- 域名（可选，但推荐）
- SSH 访问权限

### 1. 服务器准备

#### 1.1 连接到服务器

```bash
ssh root@your-server-ip
# 或使用密钥
ssh -i /path/to/key.pem user@your-server-ip
```

#### 1.2 更新系统

```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# CentOS
sudo yum update -y
```

#### 1.3 安装 Node.js

```bash
# Ubuntu/Debian - 使用 NodeSource 安装 Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# 验证安装
node --version
npm --version
```

#### 1.4 安装 PM2（进程管理器）

```bash
sudo npm install -g pm2
```

#### 1.5 安装 Nginx

```bash
# Ubuntu/Debian
sudo apt install nginx -y

# CentOS
sudo yum install nginx -y

# 启动 Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 2. 部署应用

#### 2.1 创建应用目录

```bash
# 创建目录
sudo mkdir -p /var/www/freeconvertor
cd /var/www/freeconvertor

# 设置权限（替换 your-user 为你的用户名）
sudo chown -R $USER:$USER /var/www/freeconvertor
```

#### 2.2 上传代码

**方式一：使用 Git（推荐）**

```bash
# 安装 Git
sudo apt install git -y  # Ubuntu/Debian
# 或
sudo yum install git -y  # CentOS

# 克隆项目
git clone https://github.com/YOUR_USERNAME/FreeConvertor.git .
```

**方式二：使用 SCP**

```bash
# 在本地电脑运行
scp -r /path/to/FreeConvertor/* user@your-server-ip:/var/www/freeconvertor/
```

#### 2.3 安装依赖

```bash
cd /var/www/freeconvertor
npm install --production
```

#### 2.4 配置环境变量（可选）

```bash
# 创建 .env 文件
cat > .env << EOF
NODE_ENV=production
PORT=3000
EOF
```

### 3. 使用 PM2 管理应用

#### 3.1 启动应用

```bash
# 启动应用
pm2 start server.js --name freeconvertor

# 查看状态
pm2 status

# 查看日志
pm2 logs freeconvertor
```

#### 3.2 设置开机自启

```bash
# 生成 PM2 启动脚本
pm2 startup

# 保存当前进程列表
pm2 save
```

#### 3.3 常用 PM2 命令

```bash
# 重启应用
pm2 restart freeconvertor

# 停止应用
pm2 stop freeconvertor

# 查看详细信息
pm2 show freeconvertor

# 监控
pm2 monit

# 查看日志
pm2 logs freeconvertor --lines 100
```

### 4. 配置 Nginx 反向代理

#### 4.1 创建 Nginx 配置文件

```bash
sudo nano /etc/nginx/sites-available/freeconvertor
```

#### 4.2 基础配置（HTTP）

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # 日志
    access_log /var/log/nginx/freeconvertor-access.log;
    error_log /var/log/nginx/freeconvertor-error.log;

    # 反向代理到 Node.js 应用
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        
        # WebSocket 支持
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        
        # 请求头
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 缓存配置
        proxy_cache_bypass $http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 客户端上传大小限制
    client_max_body_size 10M;
}
```

#### 4.3 启用配置

```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/freeconvertor /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

### 5. 配置 SSL（HTTPS）

#### 5.1 安装 Certbot

```bash
# Ubuntu/Debian
sudo apt install certbot python3-certbot-nginx -y

# CentOS
sudo yum install certbot python3-certbot-nginx -y
```

#### 5.2 获取 SSL 证书

```bash
# 自动配置 SSL
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 按提示输入邮箱并同意条款
```

#### 5.3 自动续期

```bash
# Certbot 会自动设置续期，测试续期
sudo certbot renew --dry-run
```

#### 5.4 完整 HTTPS 配置

Certbot 会自动修改配置，最终配置类似：

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL 证书
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # 日志
    access_log /var/log/nginx/freeconvertor-access.log;
    error_log /var/log/nginx/freeconvertor-error.log;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1000;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # 反向代理
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    client_max_body_size 10M;
}
```

### 6. 防火墙配置

```bash
# Ubuntu/Debian - UFW
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw enable

# CentOS - Firewalld
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 7. 监控和维护

#### 7.1 查看应用日志

```bash
# PM2 日志
pm2 logs freeconvertor

# Nginx 访问日志
sudo tail -f /var/log/nginx/freeconvertor-access.log

# Nginx 错误日志
sudo tail -f /var/log/nginx/freeconvertor-error.log
```

#### 7.2 性能监控

```bash
# PM2 监控
pm2 monit

# 系统资源
htop
```

#### 7.3 更新应用

```bash
cd /var/www/freeconvertor

# 拉取最新代码
git pull

# 安装依赖
npm install --production

# 重启应用
pm2 restart freeconvertor
```

### 8. 安全加固（推荐）

#### 8.1 限制访问频率

在 Nginx 配置中添加：

```nginx
# 限制请求频率
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

server {
    # ... 其他配置 ...
    
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        proxy_pass http://localhost:3000;
        # ... 其他配置 ...
    }
}
```

#### 8.2 禁用不必要的信息

```bash
# 编辑 Nginx 主配置
sudo nano /etc/nginx/nginx.conf

# 添加到 http 块
server_tokens off;
```

#### 8.3 设置失败重启

PM2 已经自动处理崩溃重启，可以查看配置：

```bash
pm2 startup
pm2 save
```

### 9. 常见问题排查

#### 应用无法启动

```bash
# 检查端口占用
sudo netstat -tlnp | grep 3000

# 查看 PM2 日志
pm2 logs freeconvertor --err

# 手动启动测试
cd /var/www/freeconvertor
node server.js
```

#### Nginx 502 错误

```bash
# 检查应用是否运行
pm2 status

# 检查端口是否正确
curl http://localhost:3000/api/health

# 检查 Nginx 配置
sudo nginx -t
```

#### SSL 证书问题

```bash
# 检查证书状态
sudo certbot certificates

# 强制续期
sudo certbot renew --force-renewal
```

---

## ☁️ 快速部署到 Vercel

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
