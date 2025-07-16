<template>
  <div class="stats-page">
    <div class="container">
      <!-- 页面头部 -->
      <div class="page-header">
        <h2>📊 学习统计</h2>
        <button class="btn btn-secondary" @click="goHome">返回首页</button>
      </div>

      <!-- 统计卡片 -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📝</div>
          <div class="stat-number">{{ quizStore.stats.totalAnswered }}</div>
          <div class="stat-label">总答题数</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">✅</div>
          <div class="stat-number">{{ quizStore.correctRate }}%</div>
          <div class="stat-label">正确率</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">❌</div>
          <div class="stat-number">{{ quizStore.wrongQuestionCount }}</div>
          <div class="stat-label">错题总数</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">⏱️</div>
          <div class="stat-number">{{ quizStore.stats.studyTime }}</div>
          <div class="stat-label">学习时长(分钟)</div>
        </div>
      </div>

      <!-- 详细统计 -->
      <div class="detailed-stats">
        <div class="stats-section">
          <h3>📈 答题分析</h3>
          <div class="stats-content">
            <div class="progress-item">
              <div class="progress-label">
                <span>正确题数</span>
                <span>{{ quizStore.stats.correctAnswers }} / {{ quizStore.stats.totalAnswered }}</span>
              </div>
              <div class="progress-bar">
                <div 
                  class="progress-fill correct" 
                  :style="{ width: quizStore.correctRate + '%' }"
                ></div>
              </div>
            </div>
            
            <div class="progress-item">
              <div class="progress-label">
                <span>错误题数</span>
                <span>{{ quizStore.stats.totalAnswered - quizStore.stats.correctAnswers }} / {{ quizStore.stats.totalAnswered }}</span>
              </div>
              <div class="progress-bar">
                <div 
                  class="progress-fill wrong" 
                  :style="{ width: (100 - quizStore.correctRate) + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div class="stats-section">
          <h3>📚 题库信息</h3>
          <div class="stats-content">
            <div class="info-item">
              <span class="info-label">题库总数：</span>
              <span class="info-value">{{ quizStore.questionCount }} 道</span>
            </div>
            <div class="info-item">
              <span class="info-label">已练习：</span>
              <span class="info-value">{{ practiceRate }}%</span>
            </div>
            <div class="info-item">
              <span class="info-label">错题率：</span>
              <span class="info-value">{{ wrongRate }}%</span>
            </div>
          </div>
        </div>

        <div class="stats-section" v-if="recentActivity.length > 0">
          <h3>🕒 最近活动</h3>
          <div class="stats-content">
            <div 
              v-for="activity in recentActivity" 
              :key="activity.timestamp"
              class="activity-item"
            >
              <div class="activity-icon" :class="{ correct: activity.isCorrect, wrong: !activity.isCorrect }">
                {{ activity.isCorrect ? '✅' : '❌' }}
              </div>
              <div class="activity-content">
                <div class="activity-result">{{ activity.isCorrect ? '答对' : '答错' }}</div>
                <div class="activity-time">{{ formatTime(activity.timestamp) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 学习建议 -->
      <div class="suggestions">
        <h3>💡 学习建议</h3>
        <div class="suggestion-list">
          <div v-for="suggestion in suggestions" :key="suggestion.id" class="suggestion-item">
            <div class="suggestion-icon">{{ suggestion.icon }}</div>
            <div class="suggestion-text">{{ suggestion.text }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuizStore } from '../stores/quiz'

const router = useRouter()
const quizStore = useQuizStore()

const practiceRate = computed(() => {
  if (quizStore.questionCount === 0) return 0
  return Math.round((quizStore.stats.totalAnswered / quizStore.questionCount) * 100)
})

const wrongRate = computed(() => {
  if (quizStore.stats.totalAnswered === 0) return 0
  return Math.round((quizStore.wrongQuestionCount / quizStore.stats.totalAnswered) * 100)
})

const recentActivity = computed(() => {
  return quizStore.userAnswers
    .slice(-10)
    .reverse()
})

const suggestions = computed(() => {
  const suggestions = []
  
  if (quizStore.stats.totalAnswered === 0) {
    suggestions.push({
      id: 1,
      icon: '🚀',
      text: '开始你的第一次刷题练习吧！'
    })
  } else {
    if (quizStore.correctRate < 60) {
      suggestions.push({
        id: 2,
        icon: '📖',
        text: '正确率较低，建议先复习相关知识点'
      })
    }
    
    if (quizStore.wrongQuestionCount > 0) {
      suggestions.push({
        id: 3,
        icon: '🔄',
        text: `你有 ${quizStore.wrongQuestionCount} 道错题，建议重点练习`
      })
    }
    
    if (quizStore.correctRate >= 80) {
      suggestions.push({
        id: 4,
        icon: '🎉',
        text: '正确率很高，继续保持！'
      })
    }
    
    if (quizStore.stats.studyTime < 30) {
      suggestions.push({
        id: 5,
        icon: '⏰',
        text: '建议每天至少学习30分钟'
      })
    }
  }
  
  return suggestions
})

const formatTime = (timestamp: number) => {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) {
    return `${days}天前`
  } else if (hours > 0) {
    return `${hours}小时前`
  } else if (minutes > 0) {
    return `${minutes}分钟前`
  } else {
    return '刚刚'
  }
}

const goHome = () => {
  router.push('/')
}
</script>

<style scoped>
.stats-page {
  min-height: calc(100vh - 80px);
  padding: 2rem 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.page-header {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-header h2 {
  margin: 0;
  color: #1f2937;
  font-size: 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2563eb;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: #6b7280;
  font-size: 1rem;
  font-weight: 500;
}

.detailed-stats {
  display: grid;
  gap: 2rem;
  margin-bottom: 3rem;
}

.stats-section {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.stats-section h3 {
  margin: 0 0 1.5rem 0;
  color: #1f2937;
  font-size: 1.3rem;
}

.stats-content {
  display: grid;
  gap: 1rem;
}

.progress-item {
  display: grid;
  gap: 0.5rem;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #374151;
  font-weight: 500;
}

.progress-bar {
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  transition: width 0.3s;
}

.progress-fill.correct {
  background: #059669;
}

.progress-fill.wrong {
  background: #dc2626;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  color: #6b7280;
}

.info-value {
  color: #1f2937;
  font-weight: 600;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

.activity-icon.correct {
  background: #d1fae5;
}

.activity-icon.wrong {
  background: #fee2e2;
}

.activity-content {
  flex: 1;
}

.activity-result {
  color: #1f2937;
  font-weight: 500;
}

.activity-time {
  color: #6b7280;
  font-size: 0.9rem;
}

.suggestions {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.suggestions h3 {
  margin: 0 0 1.5rem 0;
  color: #1f2937;
  font-size: 1.3rem;
}

.suggestion-list {
  display: grid;
  gap: 1rem;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 12px;
}

.suggestion-icon {
  font-size: 1.5rem;
}

.suggestion-text {
  color: #374151;
  line-height: 1.5;
}

.btn {
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-block;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background: #4b5563;
}

@media (max-width: 768px) {
  .container {
    padding: 0 1rem;
  }
  
  .page-header {
    flex-direction: column;
    gap: 1rem;
    padding: 1.5rem;
  }
  
  .page-header h2 {
    font-size: 1.5rem;
  }
  
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }
  
  .stat-card {
    padding: 1.5rem;
  }
  
  .stat-number {
    font-size: 2rem;
  }
  
  .stats-section,
  .suggestions {
    padding: 1.5rem;
  }
  
  .progress-label {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
}
</style>

