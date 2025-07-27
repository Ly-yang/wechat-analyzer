# app.py - Flask后端服务器
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from celery import Celery
import requests
import re
import jieba
import jieba.analyse
from datetime import datetime, timedelta
import hashlib
import json
import os
from bs4 import BeautifulSoup
import schedule
import time
from threading import Thread
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# MongoDB配置
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
client = MongoClient(MONGO_URI)
db = client.wechat_analyzer

# Celery配置
app.config['CELERY_BROKER_URL'] = 'redis://localhost:6379/0'
app.config['CELERY_RESULT_BACKEND'] = 'redis://localhost:6379/0'

celery = Celery(app.name, broker=app.config['CELERY_BROKER_URL'])
celery.conf.update(app.config)

# 微信公众号采集器
class WeChatCrawler:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        
    def search_articles(self, keyword, category='all', days=7):
        """搜索微信文章"""
        try:
            # 这里需要接入微信公众号API或第三方服务
            # 由于微信限制，这里提供模拟数据结构
            mock_articles = self._generate_mock_articles(keyword, category)
            return mock_articles
        except Exception as e:
            logger.error(f"搜索文章失败: {e}")
            return []
    
    def _generate_mock_articles(self, keyword, category):
        """生成模拟文章数据"""
        import random
        
        titles = [
            f"🔥 {keyword}必看指南：10个让你效率翻倍的技巧",
            f"💡 关于{keyword}，99%的人都不知道的秘密",
            f"📈 {keyword}赚钱攻略：从0到月入过万的完整路径",
            f"🎯 {keyword}高手都在用的5个核心方法",
            f"💰 {keyword}变现指南：普通人也能实现财务自由",
            f"🚀 {keyword}新手入门：30天从小白到专家",
            f"⚡ {keyword}效率提升：这些工具让你事半功倍",
            f"🧠 {keyword}思维升级：改变认知，改变人生"
        ]
        
        authors = ["财富自由之路", "效率工具箱", "职场进阶指南", "创业邦", "理财小达人", "成长笔记", "投资思维", "情商学院"]
        
        articles = []
        for i in range(8):
            article = {
                'id': hashlib.md5(f"{titles[i]}{i}".encode()).hexdigest(),
                'title': titles[i],
                'author': random.choice(authors),
                'content_url': f"https://mp.weixin.qq.com/s/{hashlib.md5(titles[i].encode()).hexdigest()}",
                'read_count': random.randint(50000, 500000),
                'like_count': random.randint(1000, 20000),
                'publish_time': datetime.now() - timedelta(days=random.randint(1, 7)),
                'category': category if category != 'all' else random.choice(['tech', 'finance', 'lifestyle', 'education']),
                'summary': f"这是一篇关于{keyword}的深度文章，通过实际案例和数据分析，为读者提供了有价值的见解和建议。",
                'keywords': [keyword] + [f"关键词{j}" for j in range(3)],
                'crawl_time': datetime.now()
            }
            articles.append(article)
        
        return articles
    
    def extract_content(self, url):
        """提取文章内容"""
        try:
            response = self.session.get(url, timeout=10)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # 提取文章内容
            content_div = soup.find('div', class_='rich_media_content')
            if content_div:
                return content_div.get_text(strip=True)
            return ""
        except Exception as e:
            logger.error(f"提取内容失败: {e}")
            return ""

# 文章分析器
class ArticleAnalyzer:
    def __init__(self):
        # 初始化jieba分词
        jieba.initialize()
        
        # 情感词典
        self.emotion_words = {
            'positive': ['爆款', '必看', '干货', '绝招', '秘密', '技巧', '攻略', '逆袭', '成功', '赚钱'],
            'negative': ['失败', '错误', '陷阱', '骗局', '亏损', '危险'],
            'urgent': ['紧急', '立即', '马上', '赶紧', '快速', '急需'],
            'exclusive': ['独家', '首发', '内部', '专属', '限时', '稀有']
        }
    
    def analyze_article(self, title, content=""):
        """分析文章"""
        analysis = {
            'structure': self._analyze_structure(title, content),
            'emotion': self._analyze_emotion(title, content),
            'engagement': self._analyze_engagement(title, content),
            'seo': self._analyze_seo(title, content),
            'keywords': self._extract_keywords(title, content),
            'score': 0
        }
        
        # 计算综合评分
        analysis['score'] = self._calculate_score(analysis)
        return analysis
    
    def _analyze_structure(self, title, content):
        """结构分析"""
        return {
            'title_length': len(title),
            'content_length': len(content),
            'sentence_count': len(re.findall(r'[。！？.!?]', content)),
            'paragraph_count': len(content.split('\n\n')) if content else 0,
            'avg_sentence_length': len(content) / max(len(re.findall(r'[。！？.!?]', content)), 1) if content else 0
        }
    
    def _analyze_emotion(self, title, content):
        """情感分析"""
        text = title + content
        emotion_scores = {}
        
        for emotion_type, words in self.emotion_words.items():
            score = sum(1 for word in words if word in text)
            emotion_scores[emotion_type] = score
        
        total_emotion_words = sum(emotion_scores.values())
        emotion_intensity = (total_emotion_words / max(len(text), 1)) * 100
        
        return {
            'emotion_scores': emotion_scores,
            'emotion_intensity': round(emotion_intensity, 2),
            'dominant_emotion': max(emotion_scores, key=emotion_scores.get) if emotion_scores else None
        }
    
    def _analyze_engagement(self, title, content):
        """互动性分析"""
        text = title + content
        
        return {
            'question_count': len(re.findall(r'[？?]', text)),
            'exclamation_count': len(re.findall(r'[！!]', text)),
            'number_count': len(re.findall(r'\d+', text)),
            'call_to_action': len(re.findall(r'(点赞|转发|关注|收藏|分享)', text))
        }
    
    def _analyze_seo(self, title, content):
        """SEO分析"""
        return {
            'title_length_optimal': 15 <= len(title) <= 30,
            'keyword_in_title': True,  # 简化处理
            'readability_score': 85,  # 模拟可读性评分
            'keyword_density': 3.2   # 模拟关键词密度
        }
    
    def _extract_keywords(self, title, content):
        """提取关键词"""
        text = title + content
        keywords = jieba.analyse.extract_tags(text, topK=10, withWeight=True)
        return [{'word': word, 'weight': weight} for word, weight in keywords]
    
    def _calculate_score(self, analysis):
        """计算综合评分"""
        score = 0
        
        # 结构评分 (30%)
        if 15 <= analysis['structure']['title_length'] <= 30:
            score += 30
        
        # 情感评分 (25%)
        if analysis['emotion']['emotion_intensity'] > 5:
            score += 25
        
        # 互动评分 (25%)
        engagement_total = (analysis['engagement']['question_count'] + 
                           analysis['engagement']['exclamation_count'] + 
                           analysis['engagement']['call_to_action'])
        if engagement_total >= 3:
            score += 25
        
        # SEO评分 (20%)
        if analysis['seo']['title_length_optimal']:
            score += 20
        
        return min(score, 100)

# 模板生成器
class TemplateGenerator:
    def __init__(self):
        self.templates = {
            'listicle': {
                'name': '清单型文章',
                'title_formula': '{数字} + {核心词} + {人群} + {获得感}',
                'structure': [
                    '标题：使用具体数字 + 核心关键词 + 目标人群 + 价值承诺',
                    '开头：现象描述 + 痛点挖掘 + 解决方案预告',
                    '正文：N个要点，每个要点包含解释、案例、数据支撑',
                    '结尾：总结要点 + 行动号召 + 互动引导'
                ],
                'examples': [
                    '职场人必备：5个让你加薪30%的核心技能',
                    '理财小白指南：7个让你财富翻倍的投资方法'
                ]
            },
            'howto': {
                'name': '教程指南',
                'title_formula': '如何/怎样 + {具体目标} + {时间/数量}',
                'structure': [
                    '标题：明确的how-to格式 + 具体可量化的目标',
                    '开头：问题背景 + 方法预览 + 价值承诺',
                    '正文：步骤分解 + 详细说明 + 注意事项 + 工具推荐',
                    '结尾：效果预期 + 实践建议 + 进阶学习资源'
                ],
                'examples': [
                    '如何在30天内掌握Python编程：零基础完整指南',
                    '怎样用100元开始理财：新手投资实操手册'
                ]
            }
        }
    
    def generate_template(self, article_type, audience, keywords):
        """生成写作模板"""
        template = self.templates.get(article_type, self.templates['listicle'])
        
        # 根据受众和关键词定制模板
        customized = {
            'type': template['name'],
            'audience': audience,
            'keywords': keywords.split(',') if keywords else [],
            'title_formula': template['title_formula'],
            'structure': template['structure'],
            'examples': template['examples'],
            'tips': self._generate_tips(article_type, audience),
            'generated_time': datetime.now()
        }
        
        return customized
    
    def _generate_tips(self, article_type, audience):
        """生成写作技巧"""
        base_tips = [
            '标题中使用具体数字增加可信度',
            '开头3句话内抓住读者注意力',
            '每段不超过3句话，保持可读性',
            '适当使用emoji增加视觉吸引力',
            '结尾要有明确的行动指引'
        ]
        
        audience_tips = {
            'youth': ['使用年轻人熟悉的网络用语', '多用流行梗和表情包'],
            'professional': ['提供实用的职场案例', '引用权威数据和研究'],
            'parent': ['关注育儿和家庭场景', '提供实用的生活技巧'],
            'entrepreneur': ['分享创业故事和经验', '提供商业思维和方法'],
            'senior': ['语言通俗易懂', '多用传统价值观念']
        }
        
        return base_tips + audience_tips.get(audience, [])

# 实例化核心组件
crawler = WeChatCrawler()
analyzer = ArticleAnalyzer()
template_generator = TemplateGenerator()

# Celery任务
@celery.task
def crawl_articles_task(keywords, category, min_reads):
    """异步采集任务"""
    try:
        articles = []
        for keyword in keywords:
            keyword_articles = crawler.search_articles(keyword, category)
            # 过滤阅读量
            filtered_articles = [a for a in keyword_articles if a['read_count'] >= min_reads]
            articles.extend(filtered_articles)
        
        # 保存到数据库
        for article in articles:
            db.articles.update_one(
                {'id': article['id']},
                {'$set': article},
                upsert=True
            )
        
        logger.info(f"采集完成，共获取 {len(articles)} 篇文章")
        return len(articles)
    
    except Exception as e:
        logger.error(f"采集任务失败: {e}")
        return 0

# API路由
@app.route('/api/articles/collect', methods=['POST'])
def collect_articles():
    """开始采集文章"""
    try:
        data = request.json
        keywords = data.get('keywords', ['热门']).split(',') if isinstance(data.get('keywords'), str) else data.get('keywords', ['热门'])
        category = data.get('category', 'all')
        min_reads = int(data.get('min_reads', 10000))
        
        # 启动异步任务
        task = crawl_articles_task.delay(keywords, category, min_reads)
        
        return jsonify({
            'status': 'success',
            'task_id': task.id,
            'message': '采集任务已启动'
        })
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/articles', methods=['GET'])
def get_articles():
    """获取文章列表"""
    try:
        # 获取查询参数
        category = request.args.get('category', 'all')
        limit = int(request.args.get('limit', 20))
        offset = int(request.args.get('offset', 0))
        
        # 构建查询条件
        query = {}
        if category != 'all':
            query['category'] = category
        
        # 查询数据库
        articles = list(db.articles.find(query)
                       .sort('crawl_time', -1)
                       .skip(offset)
                       .limit(limit))
        
        # 转换ObjectId为字符串
        for article in articles:
            article['_id'] = str(article['_id'])
            if isinstance(article.get('publish_time'), datetime):
                article['publish_time'] = article['publish_time'].isoformat()
            if isinstance(article.get('crawl_time'), datetime):
                article['crawl_time'] = article['crawl_time'].isoformat()
        
        total = db.articles.count_documents(query)
        
        return jsonify({
            'status': 'success',
            'data': articles,
            'total': total,
            'limit': limit,
            'offset': offset
        })
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/articles/<article_id>/analyze', methods=['POST'])
def analyze_article_endpoint(article_id):
    """分析指定文章"""
    try:
        # 从数据库获取文章
        article = db.articles.find_one({'id': article_id})
        if not article:
            return jsonify({
                'status': 'error',
                'message': '文章未找到'
            }), 404
        
        # 获取文章内容
        content = ""
        if article.get('content_url'):
            content = crawler.extract_content(article['content_url'])
        
        # 执行分析
        analysis = analyzer.analyze_article(article['title'], content)
        
        # 保存分析结果
        analysis_record = {
            'article_id': article_id,
            'analysis': analysis,
            'analyze_time': datetime.now()
        }
        
        db.analysis.update_one(
            {'article_id': article_id},
            {'$set': analysis_record},
            upsert=True
        )
        
        return jsonify({
            'status': 'success',
            'data': analysis
        })
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/analyze/text', methods=['POST'])
def analyze_text():
    """分析自定义文本"""
    try:
        data = request.json
        title = data.get('title', '')
        content = data.get('content', '')
        
        if not title and not content:
            return jsonify({
                'status': 'error',
                'message': '请提供标题或内容'
            }), 400
        
        analysis = analyzer.analyze_article(title, content)
        
        return jsonify({
            'status': 'success',
            'data': analysis
        })
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/templates/generate', methods=['POST'])
def generate_template():
    """生成写作模板"""
    try:
        data = request.json
        article_type = data.get('type', 'listicle')
        audience = data.get('audience', 'professional')
        keywords = data.get('keywords', '')
        
        template = template_generator.generate_template(article_type, audience, keywords)
        
        # 保存模板
        template_record = {
            'template': template,
            'user_id': data.get('user_id', 'anonymous'),
            'created_time': datetime.now()
        }
        
        result = db.templates.insert_one(template_record)
        template['template_id'] = str(result.inserted_id)
        
        return jsonify({
            'status': 'success',
            'data': template
        })
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/templates', methods=['GET'])
def get_templates():
    """获取模板列表"""
    try:
        user_id = request.args.get('user_id', 'anonymous')
        limit = int(request.args.get('limit', 10))
        
        templates = list(db.templates.find({'user_id': user_id})
                        .sort('created_time', -1)
                        .limit(limit))
        
        for template in templates:
            template['_id'] = str(template['_id'])
            if isinstance(template.get('created_time'), datetime):
                template['created_time'] = template['created_time'].isoformat()
        
        return jsonify({
            'status': 'success',
            'data': templates
        })
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/stats/dashboard', methods=['GET'])
def get_dashboard_stats():
    """获取仪表板统计数据"""
    try:
        # 统计数据
        total_articles = db.articles.count_documents({})
        total_analysis = db.analysis.count_documents({})
        total_templates = db.templates.count_documents({})
        
        # 最近7天的文章数量趋势
        seven_days_ago = datetime.now() - timedelta(days=7)
        recent_articles = list(db.articles.aggregate([
            {'$match': {'crawl_time': {'$gte': seven_days_ago}}},
            {'$group': {
                '_id': {'$dateToString': {'format': '%Y-%m-%d', 'date': '$crawl_time'}},
                'count': {'$sum': 1}
            }},
            {'$sort': {'_id': 1}}
        ]))
        
        # 分类统计
        category_stats = list(db.articles.aggregate([
            {'$group': {'_id': '$category', 'count': {'$sum': 1}}},
            {'$sort': {'count': -1}}
        ]))
        
        # 热门关键词
        hot_keywords = list(db.articles.aggregate([
            {'$unwind': '$keywords'},
            {'$group': {'_id': '$keywords', 'count': {'$sum': 1}}},
            {'$sort': {'count': -1}},
            {'$limit': 10}
        ]))
        
        return jsonify({
            'status': 'success',
            'data': {
                'total_articles': total_articles,
                'total_analysis': total_analysis,
                'total_templates': total_templates,
                'article_trend': recent_articles,
                'category_stats': category_stats,
                'hot_keywords': hot_keywords
            }
        })
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """健康检查"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    })

# 定时任务
def run_scheduled_tasks():
    """运行定时任务"""
    def job():
        logger.info("执行定时采集任务")
        crawl_articles_task.delay(['热门', '爆款', '干货'], 'all', 10000)
    
    schedule.every().hour.do(job)
    
    while True:
        schedule.run_pending()
        time.sleep(60)

if __name__ == '__main__':
    # 启动定时任务线程
    scheduler_thread = Thread(target=run_scheduled_tasks)
    scheduler_thread.daemon = True
    scheduler_thread.start()
    
    # 启动Flask应用
    app.run(debug=True, host='0.0.0.0', port=5000)
