<template>
  <div class="home-page">
    <div class="container">
      <!-- 欢迎区域 -->
      <div class="welcome-section">
        <h2>欢迎使用智能刷题系统</h2>
        <p>支持Excel题库上传，提供随机刷题和错题复习功能</p>
      </div>

      <!-- 上传区域 -->
      <div class="upload-section">
        <div class="upload-card">
          <h3>📁 上传题库文件</h3>
          <div 
            class="upload-area" 
            :class="{ 'drag-over': isDragOver }"
            @click="triggerFileInput"
            @dragover.prevent="handleDragOver"
            @dragleave.prevent="handleDragLeave"
            @drop.prevent="handleDrop"
          >
            <div class="upload-icon">📤</div>
            <p>点击或拖拽Excel文件到此处</p>
            <input 
              ref="fileInput"
              type="file" 
              accept=".xlsx,.xls" 
              @change="handleFileUpload"
              style="display: none"
            >
            <button class="upload-btn">选择文件</button>
          </div>
          <div v-if="quizStore.questionCount > 0" class="file-info">
            <p>已加载题目：<span>{{ quizStore.questionCount }}</span> 道</p>
            <button class="btn btn-primary" @click="startRandomQuiz">开始随机刷题</button>
          </div>
        </div>
      </div>

      <!-- 刷题模式 -->
      <div class="mode-section">
        <h3>🎯 刷题模式</h3>
        <div class="mode-cards">
          <div class="mode-card" @click="startRandomQuiz">
            <div class="mode-icon">🎲</div>
            <h4>随机刷题</h4>
            <p>从题库中随机选择题目进行练习</p>
          </div>
          <div class="mode-card" @click="startWrongQuiz">
            <div class="mode-icon">❌</div>
            <h4>错题库</h4>
            <p>专门练习之前答错的题目</p>
            <span class="wrong-count">{{ quizStore.wrongQuestionCount }} 道错题</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuizStore } from '../stores/quiz'
import * as XLSX from 'xlsx'
import type { Question } from '../stores/quiz'

const router = useRouter()
const quizStore = useQuizStore()

const fileInput = ref<HTMLInputElement>()
const isDragOver = ref(false)

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleDragOver = () => {
  isDragOver.value = true
}

const handleDragLeave = () => {
  isDragOver.value = false
}

const handleDrop = (event: DragEvent) => {
  isDragOver.value = false
  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    processFile(files[0])
  }
}

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    processFile(file)
  }
}

const processFile = (file: File) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target?.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: 'array' })
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

      parseQuestions(jsonData)
    } catch (error) {
      alert('文件解析失败，请确保文件格式正确！')
      console.error('文件解析错误:', error)
    }
  }
  reader.readAsArrayBuffer(file)
}

const parseQuestions = (data: any[][]) => {
  const questions: Question[] = []
  
  // 跳过标题行
  for (let i = 1; i < data.length; i++) {
    const row = data[i]
    if (!row || row.length < 8) continue

    const [序号, 一级纲要, 二级纲要, 题目分类, 题型, 题干, 选项, 答案, 题目依据, 试题分数, , , , 判断题解析] = row

    if (!题干 || !选项 || !答案) continue

    // 解析选项
    const optionsArray = 选项.split('|').map((opt: string) => {
      // 优先使用'-'分隔，如果没有则使用'.'分隔
      let key, value
      if (opt.includes('-')) {
        [key, value] = opt.split('-', 2)
      } else if (opt.includes('.')) {
        [key, value] = opt.split('.', 2)
      } else {
        // 如果都没有分隔符，则整个作为key
        key = opt
        value = ''
      }
      return { key: key.trim(), value: value ? value.trim() : '' }
    })

    // 确定题型
    let type: 'single' | 'multiple' | 'judge' = 'single'
    if (题型 && 题型.includes('多选')) {
      type = 'multiple'
    } else if (题型 && 题型.includes('判断')) {
      type = 'judge'
    }

    // 解析答案
    let correctAnswer: string | string[] = 答案.toString().trim()
    if (type === 'multiple') {
      correctAnswer = (correctAnswer as string).split('').sort()
    }

    const question: Question = {
      id: 序号 || questions.length + 1,
      type: type,
      question: 题干.trim(),
      options: optionsArray,
      answer: correctAnswer,
      explanation: 判断题解析 || '',
      score: 试题分数 || 1,
      category: 题目分类 || '',
      source: 题目依据 || ''
    }

    questions.push(question)
  }

  quizStore.setQuestions(questions)
  alert(`成功加载 ${questions.length} 道题目！`)
}

const startRandomQuiz = () => {
  try {
    quizStore.startQuiz('random')
    router.push('/quiz')
  } catch (error) {
    alert((error as Error).message)
  }
}

const startWrongQuiz = () => {
  try {
    quizStore.startQuiz('wrong')
    router.push('/quiz')
  } catch (error) {
    alert((error as Error).message)
  }
}
</script>

<style scoped>
.home-page {
  min-height: calc(100vh - 80px);
  padding: 2rem 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.welcome-section {
  text-align: center;
  margin-bottom: 3rem;
}

.welcome-section h2 {
  font-size: 2.5rem;
  color: white;
  margin-bottom: 1rem;
  font-weight: 700;
}

.welcome-section p {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
}

.upload-section {
  margin-bottom: 3rem;
}

.upload-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.upload-card h3 {
  margin: 0 0 1.5rem 0;
  color: #1f2937;
  font-size: 1.5rem;
}

.upload-area {
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  padding: 3rem 2rem;
  text-align: center;
  background: #f8fafc;
  cursor: pointer;
  transition: all 0.3s;
}

.upload-area:hover,
.upload-area.drag-over {
  border-color: #2563eb;
  background: #f1f5f9;
}

.upload-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.upload-area p {
  margin: 0 0 1.5rem 0;
  color: #64748b;
  font-size: 1.1rem;
}

.upload-btn {
  background: #2563eb;
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}

.upload-btn:hover {
  background: #1d4ed8;
}

.file-info {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e2e8f0;
  text-align: center;
}

.file-info p {
  margin: 0 0 1rem 0;
  color: #374151;
  font-size: 1.1rem;
}

.file-info span {
  font-weight: 600;
  color: #2563eb;
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

.btn-primary {
  background: #2563eb;
  color: white;
}

.btn-primary:hover {
  background: #1d4ed8;
}

.mode-section h3 {
  color: white;
  font-size: 1.8rem;
  margin-bottom: 2rem;
  text-align: center;
}

.mode-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.mode-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.mode-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.mode-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.mode-card h4 {
  margin: 0 0 1rem 0;
  color: #1f2937;
  font-size: 1.3rem;
}

.mode-card p {
  margin: 0 0 1rem 0;
  color: #64748b;
  line-height: 1.6;
}

.wrong-count {
  display: inline-block;
  background: #fee2e2;
  color: #dc2626;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
}

@media (max-width: 768px) {
  .container {
    padding: 0 1rem;
  }
  
  .welcome-section h2 {
    font-size: 2rem;
  }
  
  .upload-card,
  .mode-card {
    padding: 1.5rem;
  }
  
  .upload-area {
    padding: 2rem 1rem;
  }
  
  .mode-cards {
    grid-template-columns: 1fr;
  }
}
</style>

