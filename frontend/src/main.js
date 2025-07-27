// src/main.js - Vue 3前端应用
import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'

// 导入页面组件
import Dashboard from './views/Dashboard.vue'
import ArticleCollector from './views/ArticleCollector.vue'
import ArticleAnalyzer from './views/ArticleAnalyzer.vue'
import TemplateGenerator from './views/TemplateGenerator.vue'
import Settings from './views/Settings.vue'

// 路由配置
const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/dashboard', component: Dashboard, name: 'Dashboard', meta: { title: '仪表板' } },
  { path: '/collector', component: ArticleCollector, name: 'Collector', meta: { title: '文章采集' } },
  { path: '/analyzer', component: ArticleAnalyzer, name: 'Analyzer', meta: { title: '智能分析' } },
  { path: '/template', component: TemplateGenerator, name: 'Template', meta: { title: '模板生成' } },
  { path: '/settings', component: Settings, name: 'Settings', meta: { title: '系统设置' } }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Pinia状态管理
const pinia = createPinia()

// 创建应用实例
const app = createApp(App)

// 注册Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 使用插件
app.use(pinia)
app.use(router)
app.use(ElementPlus)

// 挂载应用
app.mount('#app')

// =================================
// src/App.vue - 主应用组件
export const AppVue = `
<template>
  <div id="app">
    <el-container style="height: 100vh;">
      <!-- 侧边栏 -->
      <el-aside width="250px" style="background-color: #001529;">
        <div class="logo">
          <h2 style="color: white; text-align: center; padding: 20px 0;">
            🔥 爆款分析器
          </h2>
        </div>
        
        <el-menu
          :default-active="$route.path"
          router
          background-color="#001529"
          text-color="#fff"
          active-text-color="#1890ff"
        >
          <el-menu-item index="/dashboard">
            <el-icon><DataAnalysis /></el-icon>
            <span>仪表板</span>
          </el-menu-item>
          
          <el-menu-item index="/collector">
            <el-icon><Download /></el-icon>
            <span>文章采集</span>
          </el-menu-item>
          
          <el-menu-item index="/analyzer">
            <el-icon><MagicStick /></el-icon>
            <span>智能分析</span>
          </el-menu-item>
          
          <el-menu-item index="/template">
            <el-icon><Document /></el-icon>
            <span>模板生成</span>
          </el-menu-item>
          
          <el-menu-item index="/settings">
            <el-icon><Setting /></el-icon>
            <span>系统设置</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <!-- 主内容区 -->
      <el-container>
        <!-- 顶部导航 -->
        <el-header style="background-color: #fff; border-bottom: 1px solid #e8e8e8;">
          <div style="display: flex; justify-content: space-between; align-items: center; height: 100%;">
            <h3>{{ $route.meta.title }}</h3>
            
            <div style="display: flex; align-items: center; gap: 16px;">
              <el-badge :value="notifications" class="item">
                <el-icon size="20"><Bell /></el-icon>
              </el-badge>
              
              <el-dropdown>
                <div style="display: flex; align-items: center; cursor: pointer;">
                  <el-avatar size="small">U</el-avatar>
                  <span style="margin-left: 8px;">管理员</span>
                </div>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item>个人中心</el-dropdown-item>
                    <el-dropdown-item>退出登录</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </el-header>

        <!-- 主要内容 -->
        <el-main style="background-color: #f0f2f5;">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const notifications = ref(3)
</script>

<style>
#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.logo {
  border-bottom: 1px solid #1f1f1f;
}

.el-main {
  padding: 20px;
}
</style>
`

// =================================
// src/stores/api.js - API服务
export const apiStore = `
import { defineStore } from 'pinia'
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// 创建axios实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
apiClient.interceptors.request.use(
  config => {
    // 添加认证token等
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = \`Bearer \${token}\`
    }
    return config
  },
  error => Promise.reject(error)
)

// 响应拦截器
apiClient.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API请求失败:', error)
    return Promise.reject(error)
  }
)

export const useApiStore = defineStore('api', {
  state: () => ({
    loading: false,
    error: null
  }),

  actions: {
    // 文章采集相关API
    async collectArticles(params) {
      this.loading = true
      try {
        const response = await apiClient.post('/articles/collect', params)
        return response
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async getArticles(params = {}) {
      this.loading = true
      try {
        const response = await apiClient.get('/articles', { params })
        return response
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async analyzeArticle(articleId) {
      this.loading = true
      try {
        const response = await apiClient.post(\`/articles/\${articleId}/analyze\`)
        return response
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async analyzeText(data) {
      this.loading = true
      try {
        const response = await apiClient.post('/analyze/text', data)
        return response
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async generateTemplate(params) {
      this.loading = true
      try {
        const response = await apiClient.post('/templates/generate', params)
        return response
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async getTemplates(params = {}) {
      this.loading = true
      try {
        const response = await apiClient.get('/templates', { params })
        return response
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async getDashboardStats() {
      this.loading = true
      try {
        const response = await apiClient.get('/stats/dashboard')
        return response
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
`

// =================================
// src/views/Dashboard.vue - 仪表板页面
export const DashboardVue = `
<template>
  <div>
    <!-- 统计卡片 -->
    <el-row :gutter="20" style="margin-bottom: 20px;">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #1890ff;">
              <el-icon size="24"><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.total_articles || 0 }}</div>
              <div class="stat-label">采集文章</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #52c41a;">
              <el-icon size="24"><MagicStick /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.total_analysis || 0 }}</div>
              <div class="stat-label">分析报告</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #faad14;">
              <el-icon size="24"><Files /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.total_templates || 0 }}</div>
              <div class="stat-label">生成模板</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #f5222d;">
              <el-icon size="24"><TrendCharts /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ todayGrowth }}%</div>
              <div class="stat-label">今日增长</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card title="文章采集趋势">
          <div ref="trendChart" style="height: 300px;"></div>
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card title="分类分布">
          <div ref="categoryChart" style="height: 300px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 热门关键词 -->
    <el-card title="热门关键词" style="margin-top: 20px;">
      <div class="keywords-container">
        <el-tag
          v-for="keyword in stats.hot_keywords"
          :key="keyword._id"
          size="large"
          style="margin: 5px;"
        >
          {{ keyword._id }} ({{ keyword.count }})
        </el-tag>
      </div>
    </el-card>

    <!-- 最新文章 -->
    <el-card title="最新采集文章" style="margin-top: 20px;">
      <el-table :data="recentArticles" style="width: 100%">
        <el-table-column prop="title" label="标题" min-width="300" show-overflow-tooltip />
        <el-table-column prop="author" label="作者" width="150" />
        <el-table-column prop="read_count" label="阅读量" width="100" :formatter="formatNumber" />
        <el-table-column prop="publish_time" label="发布时间" width="150" :formatter="formatDate" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="analyzeArticle(row)">
              分析
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useApiStore } from '../stores/api'
import * as echarts from 'echarts'

const apiStore = useApiStore()
const stats = ref({})
const recentArticles = ref([])
const todayGrowth = ref(12.5)

const trendChart = ref()
const categoryChart = ref()

onMounted(async () => {
  await loadDashboardData()
  initCharts()
})

const loadDashboardData = async () => {
  try {
    const response = await apiStore.getDashboardStats()
    stats.value = response.data
    
    // 获取最新文章
    const articlesResponse = await apiStore.getArticles({ limit: 5 })
    recentArticles.value = articlesResponse.data
  } catch (error) {
    console.error('加载仪表板数据失败:', error)
  }
}

const initCharts = () => {
  // 趋势图
  const trendChartInstance = echarts.init(trendChart.value)
  const trendOption = {
    title: { text: '文章采集趋势' },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] },
    yAxis: { type: 'value' },
    series: [{
      data: [120, 200, 150, 80, 70, 110, 130],
      type: 'line',
      smooth: true,
      areaStyle: {}
    }]
  }
  trendChartInstance.setOption(trendOption)

  // 分类饼图
  const categoryChartInstance = echarts.init(categoryChart.value)
  const categoryOption = {
    title: { text: '文章分类分布' },
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: '50%',
      data: [
        { value: 1048, name: '科技' },
        { value: 735, name: '财经' },
        { value: 580, name: '生活' },
        { value: 484, name: '教育' },
        { value: 300, name: '其他' }
      ]
    }]
  }
  categoryChartInstance.setOption(categoryOption)
}

const formatNumber = (row, column, cellValue) => {
  if (cellValue >= 10000) {
    return (cellValue / 10000).toFixed(1) + '万'
  }
  return cellValue.toString()
}

const formatDate = (row, column, cellValue) => {
  return new Date(cellValue).toLocaleDateString()
}

const analyzeArticle = (article) => {
  // 跳转到分析页面
  router.push(\`/analyzer?articleId=\${article.id}\`)
}
</script>

<style scoped>
.stat-card {
  height: 100px;
}

.stat-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-right: 16px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #262626;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #8c8c8c;
  margin-top: 4px;
}

.keywords-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
`

// =================================
// src/views/ArticleCollector.vue - 文章采集页面
export const ArticleCollectorVue = `
<template>
  <div>
    <!-- 采集配置 -->
    <el-card title="采集配置" style="margin-bottom: 20px;">
      <el-form :model="collectionForm" label-width="120px" inline>
        <el-form-item label="采集赛道">
          <el-select v-model="collectionForm.category" placeholder="选择赛道">
            <el-option label="全部赛道" value="all" />
            <el-option label="科技互联网" value="tech" />
            <el-option label="财经投资" value="finance" />
            <el-option label="生活方式" value="lifestyle" />
            <el-option label="教育培训" value="education" />
            <el-option label="健康养生" value="health" />
            <el-option label="娱乐八卦" value="entertainment" />
          </el-select>
        </el-form-item>

        <el-form-item label="阅读量筛选">
          <el-select v-model="collectionForm.min_reads" placeholder="最低阅读量">
            <el-option label="1万+ 阅读" :value="10000" />
            <el-option label="5万+ 阅读" :value="50000" />
            <el-option label="10万+ 阅读" :value="100000" />
            <el-option label="50万+ 阅读" :value="500000" />
          </el-select>
        </el-form-item>

        <el-form-item label="关键词">
          <el-input
            v-model="collectionForm.keywords"
            placeholder="输入关键词，多个用逗号分隔"
            style="width: 300px;"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            :loading="collecting"
            @click="startCollection"
          >
            {{ collecting ? '采集中...' : '开始采集' }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 采集状态 -->
    <el-card v-if="taskStatus" title="采集状态" style="margin-bottom: 20px;">
      <el-progress
        :percentage="taskProgress"
        :status="taskStatus === 'success' ? 'success' : 'active'"
      />
      <p style="margin-top: 10px;">{{ taskMessage }}</p>
    </el-card>

    <!-- 文章列表 -->
    <el-card title="采集结果">
      <div style="margin-bottom: 16px;">
        <el-space>
          <el-input
            v-model="searchKeyword"
            placeholder="搜索文章标题..."
            clearable
            @input="handleSearch"
            style="width: 300px;"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          
          <el-select v-model="filterCategory" placeholder="筛选分类" @change="handleFilter">
            <el-option label="全部" value="" />
            <el-option label="科技" value="tech" />
            <el-option label="财经" value="finance" />
            <el-option label="生活" value="lifestyle" />
            <el-option label="教育" value="education" />
          </el-select>
        </el-space>
      </div>

      <el-table
        :data="articles"
        v-loading="loading"
        style="width: 100%"
      >
        <el-table-column prop="title" label="标题" min-width="400" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="article-title">
              {{ row.title }}
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="author" label="作者" width="150" />
        
        <el-table-column prop="read_count" label="阅读量" width="100" sortable>
          <template #default="{ row }">
            <span class="read-count">{{ formatNumber(row.read_count) }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="like_count" label="点赞数" width="100" sortable>
          <template #default="{ row }">
            <span class="like-count">{{ formatNumber(row.like_count) }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="category" label="分类" width="100">
          <template #default="{ row }">
            <el-tag :type="getCategoryType(row.category)">
              {{ getCategoryName(row.category) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="publish_time" label="发布时间" width="150">
          <template #default="{ row }">
            {{ formatDate(row.publish_time) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-space>
              <el-button type="primary" size="small" @click="quickAnalyze(row)">
                <el-icon><MagicStick /></el-icon>
                分析
              </el-button>
              
              <el-button type="success" size="small" @click="viewArticle(row)">
                <el-icon><View /></el-icon>
                查看
              </el-button>
            </el-space>
          </template>
        </el-table-column>
      </el-table>

      <div style="text-align: center; margin-top: 20px;">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useApiStore } from '../stores/api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const apiStore = useApiStore()

// 表单数据
const collectionForm = ref({
  category: 'all',
  min_reads: 10000,
  keywords: '热门,爆款,干货'
})

// 状态数据
const collecting = ref(false)
const taskStatus = ref(null)
const taskProgress = ref(0)
const taskMessage = ref('')

// 文章列表数据
const articles = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const searchKeyword = ref('')
const filterCategory = ref('')

onMounted(() => {
  loadArticles()
})

// 开始采集
const startCollection = async () => {
  collecting.value = true
  taskStatus.value = 'active'
  taskProgress.value = 0
  taskMessage.value = '正在启动采集任务...'

  try {
    const response = await apiStore.collectArticles(collectionForm.value)
    
    // 模拟进度更新
    const progressInterval = setInterval(() => {
      taskProgress.value += 10
      if (taskProgress.value >= 100) {
        clearInterval(progressInterval)
        taskStatus.value = 'success'
        taskMessage.value = '采集完成！'
        collecting.value = false
        loadArticles() // 重新加载文章列表
      } else {
        taskMessage.value = \`正在采集文章... (\${taskProgress.value}%)\`
      }
    }, 1000)

    ElMessage.success('采集任务已启动')
  } catch (error) {
    collecting.value = false
    taskStatus.value = 'exception'
    taskMessage.value = '采集失败: ' + error.message
    ElMessage.error('启动采集任务失败')
  }
}

// 加载文章列表
const loadArticles = async () => {
  loading.value = true
  try {
    const params = {
      limit: pageSize.value,
      offset: (currentPage.value - 1) * pageSize.value,
      category: filterCategory.value,
      search: searchKeyword.value
    }
    
    const response = await apiStore.getArticles(params)
    articles.value = response.data
    total.value = response.total
  } catch (error) {
    ElMessage.error('加载文章列表失败')
  } finally {
    loading.value = false
  }
}

// 快速分析
const quickAnalyze = async (article) => {
  try {
    await apiStore.analyzeArticle(article.id)
    ElMessage.success('分析完成')
    router.push({ path: '/analyzer', query: { articleId: article.id } })
  } catch (error) {
    ElMessage.error('分析失败')
  }
}

// 查看文章
const viewArticle = (article) => {
  window.open(article.content_url, '_blank')
}

// 搜索处理
const handleSearch = () => {
  currentPage.value = 1
  loadArticles()
}

// 筛选处理
const handleFilter = () => {
  currentPage.value = 1
  loadArticles()
}

// 分页处理
const handleSizeChange = (val) => {
  pageSize.value = val
  loadArticles()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  loadArticles()
}

// 工具函数
const formatNumber = (num) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num.toString()
}

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString()
}

const getCategoryType = (category) => {
  const types = {
    tech: 'primary',
    finance: 'success',
    lifestyle: 'warning',
    education: 'info'
  }
  return types[category] || 'default'
}

const getCategoryName = (category) => {
  const names = {
    tech: '科技',
    finance: '财经',
    lifestyle: '生活',
    education: '教育'
  }
  return names[category] || '其他'
}
</script>

<style scoped>
.article-title {
  font-weight: 500;
  line-height: 1.4;
}

.read-count {
  color: #1890ff;
  font-weight: 500;
}

.like-count {
  color: #52c41a;
  font-weight: 500;
}
</style>
`
