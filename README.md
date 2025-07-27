# 🔥 公众号爆款文章采集分析工具

一个基于AI的公众号文章智能采集、分析和模板生成系统，帮助内容创作者快速找到爆款文章套路，提升写作效率。

## ✨ 功能特性

### 📊 智能采集系统
- **多平台采集**: 支持微信公众号、知乎、头条等平台
- **精准筛选**: 基于阅读量、点赞数、评论数等指标筛选爆款内容
- **分类管理**: 按科技、财经、生活、教育等领域自动分类
- **定时采集**: 支持每小时/每日/每周的自动采集

### 🧠 AI智能分析
- **文章结构分析**: 字数统计、段落分析、句式特征
- **情感吸引分析**: 检测情感词汇密度和吸引力强度
- **互动元素分析**: 统计疑问句、感叹句、数字使用情况
- **SEO优化分析**: 标题长度、关键词密度、可读性评估
- **写作套路识别**: 自动提取爆款文章的写作模式

### 📝 模板生成器
- **6种文章类型**: 清单型、教程型、故事型、分析型、热点型、情感型
- **受众细分**: 针对不同年龄和职业群体定制模板
- **标题公式**: 提供经过验证的爆款标题生成公式
- **写作指南**: 详细的内容创作和优化建议

### 📈 数据可视化
- **实时仪表板**: 展示采集统计、分析报告、趋势图表
- **热词云图**: 动态显示当前热门关键词
- **效果追踪**: 跟踪使用模板创作的文章表现

## 🏗️ 系统架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端 Vue.js   │───▶│  后端 Flask API │───▶│  数据库 MongoDB │
│   Element Plus  │    │   Celery 队列   │    │  Redis 缓存     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   AI分析引擎    │
                       │   jieba分词     │
                       │   NLP处理       │
                       └─────────────────┘
```

## 🚀 快速开始

### 环境要求
- Docker 20.0+
- Docker Compose 2.0+
- 4GB+ RAM
- 10GB+ 磁盘空间

### 一键部署

```bash
# 克隆项目
git clone https://github.com/your-repo/wechat-analyzer.git
cd wechat-analyzer

# 执行部署脚本
chmod +x deploy.sh
./deploy.sh
```

部署完成后访问: `http://localhost`

### 手动部署

```bash
# 1. 创建环境配置
cp .env.example .env
# 编辑.env文件，填入必要配置

# 2. 启动服务
docker-compose up -d

# 3. 初始化数据库
docker-compose exec backend python init_db.py

# 4. 创建管理员用户
docker-compose exec backend python create_admin.py
```

## 📋 API文档

### 文章采集

```http
POST /api/articles/collect
Content-Type: application/json

{
  "keywords": "热门,爆款,干货",
  "category": "tech",
  "min_reads": 10000
}
```

### 文章分析

```http
POST /api/analyze/text
Content-Type: application/json

{
  "title": "文章标题", 
  "content": "文章内容"
}
```

### 模板生成

```http
POST /api/templates/generate
Content-Type: application/json

{
  "type": "listicle",
  "audience": "professional", 
  "keywords": "效率,工具"
}
```

## 🔧 配置说明

### 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `MONGO_URI` | MongoDB连接字符串 | `mongodb://localhost:27017/` |
| `REDIS_URL` | Redis连接字符串 | `redis://localhost:6379/0` |
| `SECRET_KEY` | Flask密钥 | 随机生成 |
| `API_RATE_LIMIT` | API限流配置 | `100` |
| `WECHAT_APP_ID` | 微信应用ID | - |
| `WECHAT_APP_SECRET` | 微信应用密钥 | - |

### 采集配置

```python
# app.py中的采集配置
COLLECTION_CONFIG = {
    'max_articles_per_day': 1000,
    'min_read_count': 10000,
    'supported_platforms': ['wechat', 'zhihu', 'toutiao'],
    'crawl_interval': 3600,  # 秒
    'retry_times': 3
}
```

## 📊 监控运维

### 查看系统状态
```bash
./monitor.sh
```

### 数据备份
```bash
# 手动备份
./backup.sh

# 恢复数据
./restore.sh 20231201_143000
```

### 日志查看
```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务
docker-compose logs -f backend
docker-compose logs -f celery_worker
```

### 性能优化

1. **数据库优化**
   ```javascript
   // MongoDB索引优化
   db.articles.createIndex({ "crawl_time": -1 })
   db.articles.createIndex({ "read_count": -1 })
   db.articles.createIndex({ "category": 1, "read_count": -1 })
   ```

2. **缓存策略**
   ```python
   # Redis缓存配置
   CACHE_CONFIG = {
       'article_cache_ttl': 3600,
       'analysis_cache_ttl': 86400,
       'template_cache_ttl': 7200
   }
   ```

## 🔧 开发指南

### 本地开发环境

```bash
# 后端开发
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
flask run

# 前端开发
cd frontend
npm install
npm run dev
```

### 添加新的采集源

```python
# crawler/sources/new_source.py
class NewSourceCrawler(BaseCrawler):
    def __init__(self):
        super().__init__()
        self.base_url = "https://api.newsource.com"
    
    def crawl_articles(self, keyword, limit=50):
        """实现具体的采集逻辑"""
        pass
    
    def parse_article(self, raw_data):
        """解析文章数据"""
        pass
```

### 添加新的分析维度

```python
# analyzer/analyzers/custom_analyzer.py
class CustomAnalyzer(BaseAnalyzer):
    def analyze(self, title, content):
        """实现自定义分析逻辑"""
        return {
            'custom_score': self.calculate_score(content),
            'custom_features': self.extract_features(content)
        }
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 📄 许可证

本项目基于 MIT 许可证开源 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🆘 常见问题

### Q: 如何获取微信公众号API权限？
A: 需要申请微信公众平台开发者账号，获取AppID和AppSecret。

### Q: 采集速度较慢怎么办？
A: 可以通过以下方式优化：
- 增加Celery worker数量
- 调整采集间隔时间
- 使用代理IP池

### Q: 如何扩展支持更多平台？
A: 在`crawler/sources/`目录下添加新的采集器类，继承`BaseCrawler`。

### Q: 数据库占用空间过大怎么办？
A: 定期清理历史数据，设置数据保留策略：
```python
# 清理30天前的数据
db.articles.deleteMany({
    "crawl_time": {"$lt": new Date(Date.now() - 30*24*60*60*1000)}
})
```

## 📞 技术支持

- 📧 邮箱: support@wechat-analyzer.
