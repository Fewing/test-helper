<template>
  <div class="quiz-page">
    <div class="container">
      <!-- 刷题头部 -->
      <div class="quiz-header">
        <div class="quiz-progress">
          <span>{{ progress.current }}</span> / <span>{{ progress.total }}</span>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progress.percentage + '%' }"></div>
          </div>
        </div>
        <div class="quiz-actions">
          <button class="btn btn-secondary" @click="goHome">返回首页</button>
          <button class="btn btn-secondary" @click="nextQuestion" v-if="showNextButton">下一题</button>
        </div>
      </div>

      <!-- 刷题内容 -->
      <div class="quiz-content" v-if="currentQuestion">
        <div class="question-card">
          <div class="question-header">
            <span class="question-type">{{ getQuestionTypeText(currentQuestion.type) }}</span>
            <span class="question-score">{{ currentQuestion.score }}分</span>
          </div>
          <div class="question-text">
            {{ currentQuestion.question }}
          </div>
          <div class="options-container">
            <div 
              v-for="(option, index) in currentQuestion.options" 
              :key="index"
              class="option"
              :class="{ 
                selected: isOptionSelected(option.key),
                correct: showResult && isCorrectOption(option.key),
                wrong: showResult && isWrongOption(option.key)
              }"
              @click="selectOption(option.key)"
            >
              <div class="option-key">{{ option.key }}</div>
              <div class="option-text">{{ option.value }}</div>
            </div>
          </div>
          <div class="question-actions">
            <button 
              class="btn btn-primary" 
              @click="submitAnswer"
              v-if="!showResult"
              :disabled="selectedOptions.length === 0"
            >
              提交答案
            </button>
            <button 
              class="btn btn-secondary" 
              @click="nextQuestion"
              v-if="showResult"
            >
              下一题
            </button>
          </div>
        </div>

        <!-- 答题结果 -->
        <div class="result-card" v-if="showResult">
          <div class="result-header">
            <span class="result-icon">{{ isCurrentCorrect ? '✅' : '❌' }}</span>
            <span class="result-text" :class="{ correct: isCurrentCorrect, wrong: !isCurrentCorrect }">
              {{ isCurrentCorrect ? '回答正确！' : '回答错误！' }}
            </span>
          </div>
          <div class="result-details">
            <p><strong>正确答案：</strong><span>{{ formatAnswer(currentQuestion.answer) }}</span></p>
            <p><strong>您的答案：</strong><span>{{ formatAnswer(currentUserAnswer) }}</span></p>
            <div v-if="currentQuestion.explanation" class="explanation">
              <p><strong>解析：</strong><span>{{ currentQuestion.explanation }}</span></p>
            </div>
          </div>
        </div>
      </div>

      <!-- 无题目状态 -->
      <div v-else class="no-question">
        <p>没有可用的题目，请返回首页上传题库文件。</p>
        <button class="btn btn-primary" @click="goHome">返回首页</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuizStore } from '../stores/quiz'

const router = useRouter()
const quizStore = useQuizStore()

const selectedOptions = ref<string[]>([])
const showResult = ref(false)
const isCurrentCorrect = ref(false)
const currentUserAnswer = ref<string | string[]>('')
const showNextButton = ref(false)

const currentQuestion = computed(() => quizStore.getCurrentQuestion())
const progress = computed(() => quizStore.getQuestionProgress())

onMounted(() => {
  if (!currentQuestion.value) {
    alert('请先开始刷题')
    router.push('/')
  }
})

const getQuestionTypeText = (type: string) => {
  switch (type) {
    case 'single': return '单选题'
    case 'multiple': return '多选题'
    case 'judge': return '判断题'
    default: return '未知题型'
  }
}

const isOptionSelected = (key: string) => {
  return selectedOptions.value.includes(key)
}

const isCorrectOption = (key: string) => {
  if (!currentQuestion.value) return false
  const answer = currentQuestion.value.answer
  if (Array.isArray(answer)) {
    return answer.includes(key)
  }
  return answer === key
}

const isWrongOption = (key: string) => {
  if (!showResult.value || !currentQuestion.value) return false
  return isOptionSelected(key) && !isCorrectOption(key)
}

const selectOption = (key: string) => {
  if (showResult.value) return
  
  if (currentQuestion.value?.type === 'multiple') {
    // 多选题
    const index = selectedOptions.value.indexOf(key)
    if (index > -1) {
      selectedOptions.value.splice(index, 1)
    } else {
      selectedOptions.value.push(key)
    }
  } else {
    // 单选题和判断题
    selectedOptions.value = [key]
  }
}

const submitAnswer = () => {
  if (selectedOptions.value.length === 0) {
    alert('请选择答案！')
    return
  }

  let userAnswer: string | string[] = selectedOptions.value
  if (currentQuestion.value?.type === 'single' || currentQuestion.value?.type === 'judge') {
    userAnswer = selectedOptions.value[0]
  } else {
    userAnswer = selectedOptions.value.sort()
  }

  currentUserAnswer.value = userAnswer
  isCurrentCorrect.value = quizStore.submitAnswer(userAnswer)
  showResult.value = true
  showNextButton.value = true
}

const nextQuestion = () => {
  const hasNext = quizStore.nextQuestion()
  
  if (!hasNext) {
    // 刷题结束
    finishQuiz()
    return
  }
  
  // 重置状态
  selectedOptions.value = []
  showResult.value = false
  isCurrentCorrect.value = false
  currentUserAnswer.value = ''
  showNextButton.value = false
}

const finishQuiz = () => {
  quizStore.finishQuiz()
  
  const correctCount = quizStore.userAnswers.filter(a => a.isCorrect).length
  const totalCount = quizStore.userAnswers.length
  const accuracy = Math.round((correctCount / totalCount) * 100)
  
  alert(`刷题完成！\n答对：${correctCount}/${totalCount}\n正确率：${accuracy}%`)
  
  router.push('/')
}

const goHome = () => {
  router.push('/')
}

const formatAnswer = (answer: string | string[]) => {
  if (Array.isArray(answer)) {
    return answer.join(', ')
  }
  return answer
}
</script>

<style scoped>
.quiz-page {
  min-height: calc(100vh - 80px);
  padding: 2rem 0;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 2rem;
}

.quiz-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 1.5rem 2rem;
  border-radius: 16px;
  margin-bottom: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.quiz-progress {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.quiz-progress span {
  font-weight: 600;
  color: #1f2937;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #2563eb;
  transition: width 0.3s;
}

.quiz-actions {
  display: flex;
  gap: 1rem;
}

.quiz-content {
  display: grid;
  gap: 2rem;
}

.question-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.question-type {
  background: #dbeafe;
  color: #2563eb;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
}

.question-score {
  color: #059669;
  font-weight: 600;
}

.question-text {
  font-size: 1.2rem;
  line-height: 1.6;
  color: #1f2937;
  margin-bottom: 2rem;
}

.options-container {
  display: grid;
  gap: 1rem;
  margin-bottom: 2rem;
}

.option {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.option:hover {
  border-color: #2563eb;
  background: #f8fafc;
}

.option.selected {
  border-color: #2563eb;
  background: #dbeafe;
}

.option.correct {
  border-color: #059669;
  background: #d1fae5;
}

.option.wrong {
  border-color: #dc2626;
  background: #fee2e2;
}

.option-key {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: #374151;
  flex-shrink: 0;
}

.option.selected .option-key {
  background: #2563eb;
  color: white;
}

.option.correct .option-key {
  background: #059669;
  color: white;
}

.option.wrong .option-key {
  background: #dc2626;
  color: white;
}

.option-text {
  flex: 1;
  color: #374151;
  line-height: 1.5;
}

.question-actions {
  text-align: center;
}

.result-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.result-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.result-icon {
  font-size: 2rem;
}

.result-text {
  font-size: 1.3rem;
  font-weight: 600;
}

.result-text.correct {
  color: #059669;
}

.result-text.wrong {
  color: #dc2626;
}

.result-details p {
  margin: 0.5rem 0;
  color: #374151;
}

.result-details strong {
  color: #1f2937;
}

.explanation {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.explanation p {
  color: #6b7280;
  line-height: 1.6;
}

.no-question {
  text-align: center;
  background: white;
  border-radius: 16px;
  padding: 3rem 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.no-question p {
  margin: 0 0 2rem 0;
  color: #6b7280;
  font-size: 1.1rem;
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

@media (max-width: 768px) {
  .container {
    padding: 0 1rem;
  }
  
  .quiz-header {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }
  
  .quiz-actions {
    width: 100%;
    justify-content: center;
  }
  
  .question-card,
  .result-card {
    padding: 1.5rem;
  }
  
  .question-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .option {
    padding: 0.75rem;
  }
  
  .option-key {
    width: 35px;
    height: 35px;
  }
}
</style>

