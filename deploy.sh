#!/bin/bash
# deploy.sh - 一键部署脚本

set -e

echo "🚀 开始部署公众号爆款文章采集分析工具..."

# 检查Docker和Docker Compose
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装，请先安装Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose未安装，请先安装Docker Compose"
    exit 1
fi

# 创建必要的目录
echo "📁 创建项目目录..."
mkdir -p logs ssl frontend/dist

# 创建环境变量文件
echo "⚙️ 创建环境配置..."
cat > .env << EOF
# 数据库配置
MONGO_URI=mongodb://admin:password123@mongodb:27017/wechat_analyzer?authSource=admin
REDIS_URL=redis://:redis123@redis:6379/0

# 应用配置
FLASK_ENV=production
SECRET_KEY=$(openssl rand -hex 32)

# API配置
API_RATE_LIMIT=100
MAX_CONTENT_LENGTH=104857600

# 微信API配置 (需要自行申请)
WECHAT_APP_ID=your_app_id
WECHAT_APP_SECRET=your_app_secret

# 第三方服务配置
OPENAI_API_KEY=your_openai_key
QINIU_ACCESS_KEY=your_qiniu_access_key
QINIU_SECRET_KEY=your_qiniu_secret_key
EOF

# 创建MongoDB初始化脚本
echo "🗄️ 创建数据库初始化脚本..."
cat > mongo-init.js << 'EOF'
// MongoDB初始化脚本
db = db.getSiblingDB('wechat_analyzer');

// 创建用户
db.createUser({
  user: 'app_user',
  pwd: 'app_password',
  roles: [
    {
      role: 'readWrite',
      db: 'wechat_analyzer'
    }
  ]
});

// 创建集合和索引
db.articles.createIndex({ "id": 1 }, { unique: true });
db.articles.createIndex({ "crawl_time": -1 });
db.articles.createIndex({ "category": 1 });
db.articles.createIndex({ "read_count": -1 });
db.articles.createIndex({ "title": "text", "summary": "text" });

db.analysis.createIndex({ "article_id": 1 }, { unique: true });
db.analysis.createIndex({ "analyze_time": -1 });

db.templates.createIndex({ "user_id": 1 });
db.templates.createIndex({ "created_time": -1 });

// 插入示例数据
db.categories.insertMany([
  { code: 'tech', name: '科技互联网', description: '技术、互联网、AI等相关内容' },
  { code: 'finance', name: '财经投资', description: '理财、投资、股票、基金等' },
  { code: 'lifestyle', name: '生活方式', description: '生活技巧、健康、美食等' },
  { code: 'education', name: '教育培训', description: '学习方法、技能培训等' },
  { code: 'health', name: '健康养生', description: '健康知识、养生保健等' },
  { code: 'entertainment', name: '娱乐八卦', description: '娱乐新闻、明星八卦等' }
]);

print('数据库初始化完成');
EOF

# 创建前端构建脚本
echo "🎨 创建前端构建脚本..."
cat > build-frontend.sh << 'EOF'
#!/bin/bash
# 前端构建脚本

echo "🎨 开始构建前端项目..."

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js未安装，请先安装Node.js"
    exit 1
fi

# 创建前端项目目录
mkdir -p frontend
cd frontend

# 初始化Vue项目 (如果不存在)
if [ ! -f "package.json" ]; then
    echo "📦 初始化Vue项目..."
    npm create vue@latest . -- --typescript --router --pinia --eslint
fi

# 安装依赖
echo "📦 安装依赖..."
npm install
npm install element-plus @element-plus/icons-vue axios echarts

# 创建基本的Vue组件文件
echo "📝 创建组件文件..."

# 创建package.json脚本
cat > package.json << 'PACKAGE_EOF'
{
  "name": "wechat-analyzer-frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "vue": "^3.3.0",
    "vue-router": "^4.2.0",
    "pinia": "^2.1.0",
    "element-plus": "^2.3.0",
    "@element-plus/icons-vue": "^2.1.0",
    "axios": "^1.4.0",
    "echarts": "^5.4.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^4.2.0",
    "vite": "^4.3.0"
  }
}
PACKAGE_EOF

# 构建生产版本
echo "🔨 构建生产版本..."
npm run build

echo "✅ 前端构建完成"
EOF

chmod +x build-frontend.sh

# 创建SSL证书 (自签名，生产环境请使用正式证书)
echo "🔒 创建SSL证书..."
if [ ! -f "ssl/cert.pem" ]; then
    mkdir -p ssl
    openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes \
        -subj "/C=CN/ST=Beijing/L=Beijing/O=WeChatAnalyzer/CN=localhost"
fi

# 创建备份脚本
echo "📦 创建备份脚本..."
cat > backup.sh << 'EOF'
#!/bin/bash
# 数据备份脚本

BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="wechat_analyzer_backup_${DATE}.tar.gz"

echo "🗄️ 开始备份数据..."

# 创建备份目录
mkdir -p $BACKUP_DIR

# 导出MongoDB数据
echo "备份MongoDB数据..."
docker-compose exec -T mongodb mongodump --uri="mongodb://admin:password123@localhost:27017/wechat_analyzer?authSource=admin" --archive --gzip > ${BACKUP_DIR}/mongo_${DATE}.archive

# 备份Redis数据
echo "备份Redis数据..."
docker-compose exec -T redis redis-cli --rdb - > ${BACKUP_DIR}/redis_${DATE}.rdb

# 备份配置文件
echo "备份配置文件..."
tar -czf ${BACKUP_DIR}/${BACKUP_FILE} \
    .env \
    docker-compose.yml \
    nginx.conf \
    mongo-init.js \
    logs/

echo "✅ 备份完成: ${BACKUP_DIR}/${BACKUP_FILE}"

# 清理7天前的备份
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -name "*.archive" -mtime +7 -delete
find $BACKUP_DIR -name "*.rdb" -mtime +7 -delete

echo "🧹 已清理7天前的备份文件"
EOF

chmod +x backup.sh

# 创建恢复脚本
echo "🔄 创建恢复脚本..."
cat > restore.sh << 'EOF'
#!/bin/bash
# 数据恢复脚本

if [ $# -eq 0 ]; then
    echo "使用方法: ./restore.sh <备份文件日期 YYYYMMDD_HHMMSS>"
    echo "示例: ./restore.sh 20231201_143000"
    exit 1
fi

DATE=$1
BACKUP_DIR="./backups"

echo "🔄 开始恢复数据..."

# 恢复MongoDB数据
if [ -f "${BACKUP_DIR}/mongo_${DATE}.archive" ]; then
    echo "恢复MongoDB数据..."
    docker-compose exec -T mongodb mongorestore --uri="mongodb://admin:password123@localhost:27017/wechat_analyzer?authSource=admin" --archive --gzip < ${BACKUP_DIR}/mongo_${DATE}.archive
else
    echo "❌ MongoDB备份文件不存在: ${BACKUP_DIR}/mongo_${DATE}.archive"
fi

# 恢复Redis数据
if [ -f "${BACKUP_DIR}/redis_${DATE}.rdb" ]; then
    echo "恢复Redis数据..."
    docker-compose stop redis
    docker cp ${BACKUP_DIR}/redis_${DATE}.rdb wechat_analyzer_redis:/data/dump.rdb
    docker-compose start redis
else
    echo "❌ Redis备份文件不存在: ${BACKUP_DIR}/redis_${DATE}.rdb"
fi

echo "✅ 数据恢复完成"
EOF

chmod +x restore.sh

# 创建监控脚本
echo "📊 创建监控脚本..."
cat > monitor.sh << 'EOF'
#!/bin/bash
# 系统监控脚本

echo "📊 系统监控报告 - $(date)"
echo "================================"

# 容器状态
echo "🐳 容器状态:"
docker-compose ps

echo ""
echo "💾 磁盘使用情况:"
df -h

echo ""
echo "🖥️ 内存使用情况:"
free -h

echo ""
echo "📈 Docker资源使用:"
docker stats --no-stream

echo ""
echo "📊 数据库状态:"
# MongoDB连接测试
docker-compose exec -T mongodb mongo --eval "db.runCommand('ping')" wechat_analyzer

# Redis连接测试  
docker-compose exec -T redis redis-cli ping

echo ""
echo "🌐 API健康检查:"
curl -s http://localhost:5000/api/health | jq .

echo ""
echo "📝 最近的日志:"
echo "--- Backend Logs ---"
tail -n 10 logs/app.log 2>/dev/null || echo "日志文件不存在"

echo ""
echo "--- Nginx Logs ---"  
docker-compose logs --tail=10 nginx

echo "================================"
EOF

chmod +x monitor.sh

# 构建前端
echo "🎨 构建前端项目..."
./build-frontend.sh

# 启动服务
echo "🚀 启动Docker服务..."
docker-compose up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 30

# 健康检查
echo "🔍 执行健康检查..."
./monitor.sh

echo ""
echo "🎉 部署完成！"
echo ""
echo "📍 访问地址:"
echo "   前端界面: http://localhost"
echo "   API文档: http://localhost/api/health"
echo "   数据库: mongodb://localhost:27017"
echo "   Redis: redis://localhost:6379"
echo ""
echo "🔧 管理命令:"
echo "   查看状态: docker-compose ps"
echo "   查看日志: docker-compose logs -f"
echo "   停止服务: docker-compose down"
echo "   数据备份: ./backup.sh"
echo "   系统监控: ./monitor.sh"
echo ""
echo "📚 更多信息请查看README.md"
