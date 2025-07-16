import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Question {
  id: number | string
  type: 'single' | 'multiple' | 'judge'
  question: string
  options: Array<{ key: string; value: string }>
  answer: string | string[]
  explanation?: string
  score: number
  category?: string
  source?: string
}

export interface WrongQuestion {
  questionId: number | string
  userAnswer: string | string[]
  correctAnswer: string | string[]
  timestamp: number
  attempts: number
}

export interface UserAnswer {
  questionId: number | string
  userAnswer: string | string[]
  isCorrect: boolean
  timestamp: number
}

export interface Stats {
  totalAnswered: number
  correctAnswers: number
  studyTime: number
}

export const useQuizStore = defineStore('quiz', () => {
  // 状态
  const questions = ref<Question[]>([])
  const wrongQuestions = ref<WrongQuestion[]>([])
  const currentQuestionIndex = ref(0)
  const currentMode = ref<'random' | 'wrong'>('random')
  const userAnswers = ref<UserAnswer[]>([])
  const quizStartTime = ref<number | null>(null)
  const currentQuizQuestions = ref<Question[]>([])
  const stats = ref<Stats>({
    totalAnswered: 0,
    correctAnswers: 0,
    studyTime: 0
  })

  // 计算属性
  const questionCount = computed(() => questions.value.length)
  const wrongQuestionCount = computed(() => wrongQuestions.value.length)
  const correctRate = computed(() => {
    if (stats.value.totalAnswered === 0) return 0
    return Math.round((stats.value.correctAnswers / stats.value.totalAnswered) * 100)
  })

  // 方法
  const loadStoredData = () => {
    // 加载题目
    const storedQuestions = localStorage.getItem('questions')
    if (storedQuestions) {
      questions.value = JSON.parse(storedQuestions)
    }

    // 加载错题
    const storedWrongQuestions = localStorage.getItem('wrongQuestions')
    if (storedWrongQuestions) {
      wrongQuestions.value = JSON.parse(storedWrongQuestions)
    }

    // 加载统计
    const storedStats = localStorage.getItem('stats')
    if (storedStats) {
      stats.value = { ...stats.value, ...JSON.parse(storedStats) }
    }

    // 加载答题进度
    loadQuizProgress()
  }

  const saveQuestions = () => {
    localStorage.setItem('questions', JSON.stringify(questions.value))
  }

  const saveWrongQuestions = () => {
    localStorage.setItem('wrongQuestions', JSON.stringify(wrongQuestions.value))
  }

  const saveStats = () => {
    localStorage.setItem('stats', JSON.stringify(stats.value))
  }

  const saveQuizProgress = () => {
    if (currentQuizQuestions.value.length > 0) {
      const progressData = {
        currentQuestionIndex: currentQuestionIndex.value,
        currentMode: currentMode.value,
        userAnswers: userAnswers.value,
        quizStartTime: quizStartTime.value,
        currentQuizQuestions: currentQuizQuestions.value
      }
      localStorage.setItem('quizProgress', JSON.stringify(progressData))
    }
  }

  const loadQuizProgress = () => {
    const storedProgress = localStorage.getItem('quizProgress')
    if (storedProgress) {
      try {
        const progressData = JSON.parse(storedProgress)
        currentQuestionIndex.value = progressData.currentQuestionIndex || 0
        currentMode.value = progressData.currentMode || 'random'
        userAnswers.value = progressData.userAnswers || []
        quizStartTime.value = progressData.quizStartTime
        currentQuizQuestions.value = progressData.currentQuizQuestions || []
      } catch (error) {
        console.error('加载答题进度失败:', error)
        clearQuizProgress()
      }
    }
  }

  const clearQuizProgress = () => {
    localStorage.removeItem('quizProgress')
  }

  const hasQuizProgress = () => {
    const storedProgress = localStorage.getItem('quizProgress')
    if (!storedProgress) return false
    
    try {
      const progressData = JSON.parse(storedProgress)
      return progressData.currentQuizQuestions && 
             progressData.currentQuizQuestions.length > 0 &&
             progressData.currentQuestionIndex < progressData.currentQuizQuestions.length
    } catch {
      return false
    }
  }

  const setQuestions = (newQuestions: Question[]) => {
    questions.value = newQuestions
    saveQuestions()
  }

  const startQuiz = (mode: 'random' | 'wrong') => {
    if (questions.value.length === 0) {
      throw new Error('请先上传题库文件！')
    }

    if (mode === 'wrong' && wrongQuestions.value.length === 0) {
      throw new Error('错题库为空，请先进行随机刷题！')
    }

    currentMode.value = mode
    currentQuestionIndex.value = 0
    userAnswers.value = []
    quizStartTime.value = Date.now()

    // 准备题目列表
    if (mode === 'random') {
      currentQuizQuestions.value = [...questions.value].sort(() => Math.random() - 0.5)
    } else if (mode === 'wrong') {
      currentQuizQuestions.value = wrongQuestions.value
        .map(wq => questions.value.find(q => q.id === wq.questionId))
        .filter(q => q) as Question[]
    }

    if (currentQuizQuestions.value.length === 0) {
      throw new Error('没有可用的题目！')
    }
  }

  const submitAnswer = (userAnswer: string | string[]) => {
    const question = currentQuizQuestions.value[currentQuestionIndex.value]
    if (!question) return false

    // 判断答案是否正确
    let isCorrect = false
    if (question.type === 'multiple') {
      const sortedUserAnswer = Array.isArray(userAnswer) ? userAnswer.sort() : [userAnswer].sort()
      const sortedCorrectAnswer = Array.isArray(question.answer) ? question.answer.sort() : [question.answer].sort()
      isCorrect = JSON.stringify(sortedUserAnswer) === JSON.stringify(sortedCorrectAnswer)
    } else {
      isCorrect = userAnswer === question.answer
    }

    // 记录答案
    userAnswers.value.push({
      questionId: question.id,
      userAnswer,
      isCorrect,
      timestamp: Date.now()
    })

    // 更新统计
    stats.value.totalAnswered++
    if (isCorrect) {
      stats.value.correctAnswers++
    } else {
      // 添加到错题库
      addToWrongQuestions(question, userAnswer)
    }

    saveStats()
    saveQuizProgress()
    return isCorrect
  }

  const addToWrongQuestions = (question: Question, userAnswer: string | string[]) => {
    // 检查是否已存在
    const existingIndex = wrongQuestions.value.findIndex(wq => wq.questionId === question.id)
    
    const wrongItem: WrongQuestion = {
      questionId: question.id,
      userAnswer,
      correctAnswer: question.answer,
      timestamp: Date.now(),
      attempts: 1
    }

    if (existingIndex >= 0) {
      wrongQuestions.value[existingIndex].attempts++
      wrongQuestions.value[existingIndex].timestamp = Date.now()
    } else {
      wrongQuestions.value.push(wrongItem)
    }

    saveWrongQuestions()
  }

  const nextQuestion = () => {
    currentQuestionIndex.value++
    // 保存答题进度
    saveQuizProgress()
    return currentQuestionIndex.value < currentQuizQuestions.value.length
  }

  const finishQuiz = () => {
    if (quizStartTime.value) {
      const totalTime = Math.round((Date.now() - quizStartTime.value) / 1000 / 60)
      stats.value.studyTime += totalTime
      saveStats()
    }
    // 清除答题进度
    clearQuizProgress()
  }

  const clearWrongQuestions = () => {
    wrongQuestions.value = []
    localStorage.removeItem('wrongQuestions')
  }

  const getCurrentQuestion = () => {
    return currentQuizQuestions.value[currentQuestionIndex.value]
  }

  const getQuestionProgress = () => {
    return {
      current: currentQuestionIndex.value + 1,
      total: currentQuizQuestions.value.length,
      percentage: ((currentQuestionIndex.value + 1) / currentQuizQuestions.value.length) * 100
    }
  }

  return {
    // 状态
    questions,
    wrongQuestions,
    currentQuestionIndex,
    currentMode,
    userAnswers,
    quizStartTime,
    currentQuizQuestions,
    stats,
    
    // 计算属性
    questionCount,
    wrongQuestionCount,
    correctRate,
    
    // 方法
    loadStoredData,
    setQuestions,
    startQuiz,
    submitAnswer,
    nextQuestion,
    finishQuiz,
    clearWrongQuestions,
    getCurrentQuestion,
    getQuestionProgress,
    clearQuizProgress,
    hasQuizProgress
  }
})

