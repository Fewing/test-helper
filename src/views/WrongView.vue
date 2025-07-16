<template>
  <div class="wrong-page">
    <div class="container">
      <!-- 页面头部 -->
      <div class="page-header">
        <h2>❌ 错题库</h2>
        <div class="page-actions">
          <button class="btn btn-secondary" @click="goHome">返回首页</button>
          <button 
            class="btn btn-primary" 
            @click="startWrongQuiz"
            :disabled="quizStore.wrongQuestionCount === 0"
          >
            开始错题练习
          </button>
          <button 
            class="btn btn-danger" 
            @click="clearWrongQuestions"
            :disabled="quizStore.wrongQuestionCount === 0"
          >
            清空错题库
          </button>
        </div>
      </div>

      <!-- 错题列表 -->
      <div class="wrong-list">
        <div v-if="quizStore.wrongQuestionCount === 0" class="empty-state">
          <div class="empty-icon">📝</div>
          <h3>暂无错题</h3>
          <p>开始刷题后，答错的题目会自动添加到这里</p>
          <button class="btn btn-primary" @click="goHome">开始刷题</button>
        </div>

        <div 
          v-else
          v-for="wrongItem in wrongQuestionsWithDetails" 
          :key="wrongItem.questionId"
          class="wrong-item"
        >
          <div class="wrong-item-header">
            <span class="wrong-item-type">{{ getQuestionTypeText(wrongItem.question?.type || 'single') }}</span>
            <span class="wrong-item-date">{{ formatDate(wrongItem.timestamp) }}</span>
          </div>
          <div class="wrong-item-question">{{ wrongItem.question?.question }}</div>
          <div class="wrong-item-answers">
            <p>
              <strong>您的答案：</strong>
              <span class="wrong-answer">{{ formatAnswer(wrongItem.userAnswer) }}</span>
            </p>
            <p>
              <strong>正确答案：</strong>
              <span class="correct-answer">{{ formatAnswer(wrongItem.correctAnswer) }}</span>
            </p>
            <p><strong>错误次数：</strong>{{ wrongItem.attempts }}</p>
          </div>
          <div v-if="wrongItem.question?.explanation" class="wrong-item-explanation">
            <strong>解析：</strong>{{ wrongItem.question.explanation }}
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

const wrongQuestionsWithDetails = computed(() => {
  return quizStore.wrongQuestions.map(wrongItem => {
    const question = quizStore.questions.find(q => q.id === wrongItem.questionId)
    return {
      ...wrongItem,
      question
    }
  })
})

const getQuestionTypeText = (type: string) => {
  switch (type) {
    case 'single': return '单选题'
    case 'multiple': return '多选题'
    case 'judge': return '判断题'
    default: return '未知题型'
  }
}

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString('zh-CN')
}

const formatAnswer = (answer: string | string[]) => {
  if (Array.isArray(answer)) {
    return answer.join(', ')
  }
  return answer
}

const goHome = () => {
  router.push('/')
}

const startWrongQuiz = () => {
  try {
    quizStore.startQuiz('wrong')
    router.push('/quiz')
  } catch (error) {
    alert((error as Error).message)
  }
}

const clearWrongQuestions = () => {
  if (confirm('确定要清空错题库吗？')) {
    quizStore.clearWrongQuestions()
  }
}
</script>

<style scoped>
.wrong-page {
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

.page-actions {
  display: flex;
  gap: 1rem;
}

.wrong-list {
  display: grid;
  gap: 1.5rem;
}

.empty-state {
  background: white;
  border-radius: 16px;
  padding: 4rem 2rem;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  margin: 0 0 1rem 0;
  color: #1f2937;
  font-size: 1.5rem;
}

.empty-state p {
  margin: 0 0 2rem 0;
  color: #6b7280;
  font-size: 1.1rem;
}

.wrong-item {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.wrong-item:hover {
  transform: translateY(-2px);
}

.wrong-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.wrong-item-type {
  background: #fee2e2;
  color: #dc2626;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
}

.wrong-item-date {
  color: #6b7280;
  font-size: 0.9rem;
}

.wrong-item-question {
  font-size: 1.1rem;
  line-height: 1.6;
  color: #1f2937;
  margin-bottom: 1.5rem;
  font-weight: 500;
}

.wrong-item-answers {
  display: grid;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.wrong-item-answers p {
  margin: 0;
  color: #374151;
}

.wrong-item-answers strong {
  color: #1f2937;
}

.wrong-answer {
  color: #dc2626;
  font-weight: 500;
}

.correct-answer {
  color: #059669;
  font-weight: 500;
}

.wrong-item-explanation {
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
  color: #6b7280;
  line-height: 1.6;
}

.wrong-item-explanation strong {
  color: #374151;
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

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #2563eb;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #1d4ed8;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background: #4b5563;
}

.btn-danger {
  background: #dc2626;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #b91c1c;
}

@media (max-width: 768px) {
  .container {
    padding: 0 1rem;
  }
  
  .page-header {
    flex-direction: column;
    gap: 1.5rem;
    padding: 1.5rem;
  }
  
  .page-header h2 {
    font-size: 1.5rem;
  }
  
  .page-actions {
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .wrong-item {
    padding: 1.5rem;
  }
  
  .wrong-item-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .empty-state {
    padding: 3rem 1.5rem;
  }
}
</style>

