#!/bin/bash

###############################################################################
# FreeConvertor 自动部署脚本
# 用法: ./deploy.sh [domain] [email]
# 示例: ./deploy.sh example.com admin@example.com
###############################################################################

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印函数
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_header() {
    echo ""
    echo -e "${BLUE}=================================================="
    echo -e "$1"
    echo -e "==================================================${NC}"
    echo ""
}

# 检查是否为 root 用户
check_root() {
    if [ "$EUID" -eq 0 ]; then
        print_error "请不要使用 root 用户运行此脚本"
        print_info "建议使用普通用户，脚本会在需要时提示输入 sudo 密码"
        exit 1
    fi
}

# 验证域名格式
validate_domain() {
    local domain=$1
    # 支持多级子域名的正则表达式
    if [[ ! $domain =~ ^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$ ]]; then
        return 1
    fi
    return 0
}

# 验证邮箱格式
validate_email() {
    local email=$1
    # 支持更多合法邮箱格式：
    # - 支持 + 号（plus addressing）
    # - 支持多个点
    # - 支持多级子域名的邮件服务商
    if [[ ! $email =~ ^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$ ]]; then
        return 1
    fi
    return 0
}

# 获取域名
get_domain() {
    if [ -n "$1" ]; then
        DOMAIN=$1
        if ! validate_domain "$DOMAIN"; then
            print_error "无效的域名格式: $DOMAIN"
            print_info "域名格式示例: example.com 或 sub.example.com"
            exit 1
        fi
    else
        print_header "域名配置"
        print_info "请输入您的域名（如: example.com）"
        print_warning "如果您还没有域名，可以："
        echo "  1. 使用 IP 地址（仅 HTTP，不推荐）"
        echo "  2. 购买域名后再运行此脚本"
        echo ""
        read -p "请输入域名（或按 Ctrl+C 退出）: " DOMAIN
        
        if [ -z "$DOMAIN" ]; then
            print_error "域名不能为空"
            exit 1
        fi
        
        if ! validate_domain "$DOMAIN"; then
            print_error "无效的域名格式"
            print_info "域名格式示例: example.com 或 sub.example.com"
            exit 1
        fi
    fi
    
    print_success "域名设置为: $DOMAIN"
}

# 获取邮箱
get_email() {
    if [ -n "$1" ]; then
        EMAIL=$1
        if ! validate_email "$EMAIL"; then
            print_error "无效的邮箱格式: $EMAIL"
            exit 1
        fi
    else
        print_info "请输入您的邮箱地址（用于 SSL 证书通知）"
        read -p "邮箱地址: " EMAIL
        
        if [ -z "$EMAIL" ]; then
            print_error "邮箱不能为空"
            exit 1
        fi
        
        if ! validate_email "$EMAIL"; then
            print_error "无效的邮箱格式"
            exit 1
        fi
    fi
    
    print_success "邮箱设置为: $EMAIL"
}

# 检测系统类型
detect_os() {
    print_header "检测系统环境"
    
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        VERSION=$VERSION_ID
        print_success "检测到系统: $PRETTY_NAME"
    else
        print_error "无法检测系统类型"
        exit 1
    fi
}

# 安装依赖
install_dependencies() {
    print_header "安装系统依赖"
    
    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        print_info "更新软件包列表..."
        sudo apt update
        
        print_info "安装必要软件..."
        sudo apt install -y curl git nginx certbot python3-certbot-nginx
        
    elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ]; then
        print_info "更新软件包列表..."
        sudo yum update -y
        
        print_info "安装必要软件..."
        sudo yum install -y curl git nginx certbot python3-certbot-nginx
    else
        print_error "不支持的系统: $OS"
        exit 1
    fi
    
    print_success "系统依赖安装完成"
}

# 安装 Node.js
install_nodejs() {
    print_header "安装 Node.js"
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_info "Node.js 已安装: $NODE_VERSION"
        
        # 检查版本是否满足要求
        MAJOR_VERSION=$(node --version | cut -d'.' -f1 | sed 's/v//')
        if [ "$MAJOR_VERSION" -lt 14 ]; then
            print_warning "Node.js 版本过低，需要升级到 14.x 或更高版本"
        else
            print_success "Node.js 版本满足要求"
            return
        fi
    fi
    
    print_info "安装 Node.js 18.x..."
    
    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ]; then
        curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
        sudo yum install -y nodejs
    fi
    
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    print_success "Node.js 安装完成: $NODE_VERSION"
    print_success "npm 版本: $NPM_VERSION"
}

# 安装 PM2
install_pm2() {
    print_header "安装 PM2"
    
    if command -v pm2 &> /dev/null; then
        PM2_VERSION=$(pm2 --version)
        print_info "PM2 已安装: $PM2_VERSION"
    else
        print_info "安装 PM2..."
        sudo npm install -g pm2
        print_success "PM2 安装完成"
    fi
}

# 部署应用
deploy_app() {
    print_header "部署应用"
    
    APP_DIR="/var/www/freeconvertor"
    
    print_info "创建应用目录: $APP_DIR"
    sudo mkdir -p $APP_DIR
    
    # 先检查 rsync 是否可用
    if command -v rsync &> /dev/null; then
        print_info "使用 rsync 复制应用文件（排除不必要的文件）..."
        sudo rsync -av --chown=$USER:$USER \
            --exclude='.git' \
            --exclude='node_modules' \
            --exclude='.env' \
            --exclude='*.log' \
            --exclude='.DS_Store' \
            --exclude='npm-debug.log*' \
            . $APP_DIR/
    else
        print_info "复制应用文件（排除 .git 目录）..."
        # 确保目录权限
        sudo chown -R $USER:$USER $APP_DIR
        
        # 使用 tar 排除不必要的文件
        tar --exclude='.git' \
            --exclude='node_modules' \
            --exclude='.env' \
            --exclude='*.log' \
            --exclude='.DS_Store' \
            -cf - . | (cd $APP_DIR && tar -xf -)
        
        # 再次确保权限
        sudo chown -R $USER:$USER $APP_DIR
    fi
    
    cd $APP_DIR
    
    print_info "安装应用依赖..."
    npm install --production
    
    print_success "应用部署完成"
}

# 配置 PM2
configure_pm2() {
    print_header "配置 PM2"
    
    cd /var/www/freeconvertor
    
    # 停止旧进程（如果存在）
    pm2 delete freeconvertor 2>/dev/null || true
    
    print_info "启动应用..."
    pm2 start server.js --name freeconvertor
    
    print_info "设置开机自启..."
    pm2 startup | tail -1 | sudo bash
    pm2 save
    
    print_success "PM2 配置完成"
    
    # 显示状态
    print_info "应用状态:"
    pm2 status
}

# 配置 Nginx
configure_nginx() {
    print_header "配置 Nginx"
    
    NGINX_CONFIG="/etc/nginx/sites-available/freeconvertor"
    
    print_info "创建 Nginx 配置文件..."
    
    sudo tee $NGINX_CONFIG > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    # 日志
    access_log /var/log/nginx/freeconvertor-access.log;
    error_log /var/log/nginx/freeconvertor-error.log;

    # 反向代理到 Node.js 应用
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        
        # WebSocket 支持
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        
        # 请求头
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # 缓存配置
        proxy_cache_bypass \$http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 客户端上传大小限制
    client_max_body_size 10M;
}
EOF
    
    print_info "启用 Nginx 配置..."
    sudo ln -sf $NGINX_CONFIG /etc/nginx/sites-enabled/freeconvertor
    
    # 删除默认配置（如果存在）
    sudo rm -f /etc/nginx/sites-enabled/default
    
    print_info "测试 Nginx 配置..."
    sudo nginx -t
    
    print_info "重启 Nginx..."
    sudo systemctl restart nginx
    sudo systemctl enable nginx
    
    print_success "Nginx 配置完成"
}

# 配置 SSL
configure_ssl() {
    print_header "配置 SSL 证书"
    
    print_info "使用 Let's Encrypt 获取免费 SSL 证书..."
    print_warning "请确保域名 $DOMAIN 已正确解析到此服务器"
    
    read -p "是否继续配置 SSL？(y/n): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "跳过 SSL 配置"
        print_info "您可以稍后运行以下命令配置 SSL:"
        echo "  sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
        return
    fi
    
    print_info "获取 SSL 证书..."
    sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email $EMAIL
    
    print_success "SSL 证书配置完成"
    
    print_info "测试证书自动续期..."
    sudo certbot renew --dry-run
    
    print_success "SSL 自动续期测试通过"
}

# 配置防火墙
configure_firewall() {
    print_header "配置防火墙"
    
    if command -v ufw &> /dev/null; then
        print_info "配置 UFW 防火墙..."
        sudo ufw allow 22/tcp comment 'SSH'
        sudo ufw allow 80/tcp comment 'HTTP'
        sudo ufw allow 443/tcp comment 'HTTPS'
        sudo ufw --force enable
        print_success "UFW 防火墙配置完成"
        
    elif command -v firewall-cmd &> /dev/null; then
        print_info "配置 Firewalld..."
        sudo firewall-cmd --permanent --add-service=ssh
        sudo firewall-cmd --permanent --add-service=http
        sudo firewall-cmd --permanent --add-service=https
        sudo firewall-cmd --reload
        print_success "Firewalld 配置完成"
        
    else
        print_warning "未检测到防火墙，请手动配置开放端口 22, 80, 443"
    fi
}

# 显示部署信息
show_deployment_info() {
    print_header "部署完成！"
    
    echo -e "${GREEN}"
    echo "🎉 恭喜！FreeConvertor 已成功部署"
    echo ""
    echo "访问地址:"
    echo "  - HTTP:  http://$DOMAIN"
    echo "  - HTTPS: https://$DOMAIN (如果已配置 SSL)"
    echo ""
    echo "常用管理命令:"
    echo "  查看应用状态:  pm2 status"
    echo "  查看应用日志:  pm2 logs freeconvertor"
    echo "  重启应用:      pm2 restart freeconvertor"
    echo "  查看 Nginx 日志: sudo tail -f /var/log/nginx/freeconvertor-access.log"
    echo ""
    echo "测试 API:"
    echo "  curl https://$DOMAIN/api/health"
    echo -e "${NC}"
}

# 主函数
main() {
    print_header "FreeConvertor 自动部署脚本"
    
    # 检查环境
    check_root
    
    # 获取配置
    get_domain "$1"
    get_email "$2"
    
    # 确认部署
    echo ""
    print_warning "即将开始部署，确认信息:"
    echo "  域名: $DOMAIN"
    echo "  邮箱: $EMAIL"
    echo ""
    read -p "确认无误，继续部署？(y/n): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "部署已取消"
        exit 1
    fi
    
    # 开始部署
    detect_os
    install_dependencies
    install_nodejs
    install_pm2
    deploy_app
    configure_pm2
    configure_nginx
    configure_ssl
    configure_firewall
    show_deployment_info
}

# 运行主函数
main "$@"
