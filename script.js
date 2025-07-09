// 全局变量
let questions = [];
let wrongQuestions = [];
let currentQuestionIndex = 0;
let currentMode = 'random';
let userAnswers = [];
let quizStartTime = null;
let stats = {
    totalAnswered: 0,
    correctAnswers: 0,
    studyTime: 0
};

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    loadStoredData();
    updateUI();
    setupEventListeners();
});

// 设置事件监听器
function setupEventListeners() {
    // 导航按钮
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const page = this.dataset.page;
            showPage(page);
        });
    });

    // 文件上传
    const fileInput = document.getElementById('file-input');
    const uploadArea = document.getElementById('upload-area');

    fileInput.addEventListener('change', handleFileUpload);

    // 拖拽上传
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.style.borderColor = '#2563eb';
        this.style.background = '#f1f5f9';
    });

    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        this.style.borderColor = '#cbd5e1';
        this.style.background = '#f8fafc';
    });

    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        this.style.borderColor = '#cbd5e1';
        this.style.background = '#f8fafc';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload({ target: { files: files } });
        }
    });
}

// 页面切换
function showPage(pageId) {
    // 隐藏所有页面
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // 显示目标页面
    document.getElementById(pageId + '-page').classList.add('active');

    // 更新导航按钮状态
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-page="${pageId}"]`).classList.add('active');

    // 页面特定逻辑
    if (pageId === 'wrong') {
        displayWrongQuestions();
    } else if (pageId === 'stats') {
        displayStats();
    }
}

// 处理文件上传
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            parseQuestions(jsonData);
        } catch (error) {
            alert('文件解析失败，请确保文件格式正确！');
            console.error('文件解析错误:', error);
        }
    };
    reader.readAsArrayBuffer(file);
}

// 解析题目数据
function parseQuestions(data) {
    questions = [];
    
    // 跳过标题行
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length < 8) continue;

        const [序号, 一级纲要, 二级纲要, 题目分类, 题型, 题干, 选项, 答案, 题目依据, 试题分数, , , , 判断题解析] = row;

        if (!题干 || !选项 || !答案) continue;

        // 解析选项
        const optionsArray = 选项.split('|').map(opt => {
            // 优先使用'-'分隔，如果没有则使用'.'分隔
            let key, value;
            if (opt.includes('-')) {
                [key, value] = opt.split('-', 2);
            } else if (opt.includes('.')) {
                [key, value] = opt.split('.', 2);
            } else {
                // 如果都没有分隔符，则整个作为key
                key = opt;
                value = '';
            }
            return { key: key.trim(), value: value ? value.trim() : '' };
        });

        // 确定题型
        let type = 'single';
        if (题型 && 题型.includes('多选')) {
            type = 'multiple';
        } else if (题型 && 题型.includes('判断')) {
            type = 'judge';
        }

        // 解析答案
        let correctAnswer = 答案.toString().trim();
        if (type === 'multiple') {
            correctAnswer = correctAnswer.split('').sort();
        }

        const question = {
            id: 序号 || questions.length + 1,
            type: type,
            question: 题干.trim(),
            options: optionsArray,
            answer: correctAnswer,
            explanation: 判断题解析 || '',
            score: 试题分数 || 1,
            category: 题目分类 || '',
            source: 题目依据 || ''
        };

        questions.push(question);
    }

    // 保存到本地存储
    localStorage.setItem('questions', JSON.stringify(questions));
    
    // 更新UI
    updateUI();
    
    alert(`成功加载 ${questions.length} 道题目！`);
}

// 更新UI
function updateUI() {
    // 更新题目数量
    document.getElementById('question-count').textContent = questions.length;
    
    // 更新错题数量
    document.getElementById('wrong-count').textContent = `${wrongQuestions.length} 道错题`;
    
    // 显示/隐藏文件信息
    const fileInfo = document.getElementById('file-info');
    if (questions.length > 0) {
        fileInfo.style.display = 'block';
    } else {
        fileInfo.style.display = 'none';
    }
}

// 开始刷题
function startQuiz(mode) {
    if (questions.length === 0) {
        alert('请先上传题库文件！');
        return;
    }

    if (mode === 'wrong' && wrongQuestions.length === 0) {
        alert('错题库为空，请先进行随机刷题！');
        return;
    }

    currentMode = mode;
    currentQuestionIndex = 0;
    userAnswers = [];
    quizStartTime = Date.now();

    // 准备题目列表
    let quizQuestions = [];
    if (mode === 'random') {
        quizQuestions = [...questions].sort(() => Math.random() - 0.5);
    } else if (mode === 'wrong') {
        quizQuestions = wrongQuestions.map(wq => 
            questions.find(q => q.id === wq.questionId)
        ).filter(q => q);
    }

    if (quizQuestions.length === 0) {
        alert('没有可用的题目！');
        return;
    }

    // 设置当前题目列表
    window.currentQuizQuestions = quizQuestions;
    
    showPage('quiz');
    displayQuestion();
}

// 显示题目
function displayQuestion() {
    const question = window.currentQuizQuestions[currentQuestionIndex];
    if (!question) return;

    // 更新进度
    document.getElementById('current-question').textContent = currentQuestionIndex + 1;
    document.getElementById('total-questions').textContent = window.currentQuizQuestions.length;
    
    const progress = ((currentQuestionIndex + 1) / window.currentQuizQuestions.length) * 100;
    document.getElementById('progress-fill').style.width = progress + '%';

    // 显示题目信息
    document.getElementById('question-type').textContent = getQuestionTypeText(question.type);
    document.getElementById('question-score').textContent = question.score + '分';
    document.getElementById('question-text').textContent = question.question;

    // 生成选项
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';

    question.options.forEach((option, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option';
        optionDiv.dataset.key = option.key;
        
        optionDiv.innerHTML = `
            <div class="option-key">${option.key}</div>
            <div class="option-text">${option.value}</div>
        `;

        optionDiv.addEventListener('click', function() {
            selectOption(this, question.type);
        });

        optionsContainer.appendChild(optionDiv);
    });

    // 重置按钮状态
    document.getElementById('submit-btn').style.display = 'inline-block';
    document.getElementById('next-btn').style.display = 'none';
    document.getElementById('result-card').style.display = 'none';
}

// 选择选项
function selectOption(optionElement, questionType) {
    if (questionType === 'multiple') {
        // 多选题
        optionElement.classList.toggle('selected');
    } else {
        // 单选题和判断题
        document.querySelectorAll('.option').forEach(opt => {
            opt.classList.remove('selected');
        });
        optionElement.classList.add('selected');
    }
}

// 提交答案
function submitAnswer() {
    const question = window.currentQuizQuestions[currentQuestionIndex];
    const selectedOptions = document.querySelectorAll('.option.selected');
    
    if (selectedOptions.length === 0) {
        alert('请选择答案！');
        return;
    }

    // 获取用户答案
    let userAnswer = [];
    selectedOptions.forEach(opt => {
        userAnswer.push(opt.dataset.key);
    });

    if (question.type === 'single' || question.type === 'judge') {
        userAnswer = userAnswer[0];
    } else {
        userAnswer = userAnswer.sort();
    }

    // 判断答案是否正确
    let isCorrect = false;
    if (question.type === 'multiple') {
        isCorrect = JSON.stringify(userAnswer) === JSON.stringify(question.answer);
    } else {
        isCorrect = userAnswer === question.answer;
    }

    // 记录答案
    userAnswers.push({
        questionId: question.id,
        userAnswer: userAnswer,
        isCorrect: isCorrect,
        timestamp: Date.now()
    });

    // 更新统计
    stats.totalAnswered++;
    if (isCorrect) {
        stats.correctAnswers++;
    } else {
        // 添加到错题库
        addToWrongQuestions(question, userAnswer);
    }

    // 显示结果
    displayResult(question, userAnswer, isCorrect);
    
    // 保存统计数据
    saveStats();
}

// 显示答题结果
function displayResult(question, userAnswer, isCorrect) {
    const resultCard = document.getElementById('result-card');
    const resultIcon = document.getElementById('result-icon');
    const resultText = document.getElementById('result-text');
    const correctAnswerSpan = document.getElementById('correct-answer');
    const userAnswerSpan = document.getElementById('user-answer');
    const explanationDiv = document.getElementById('explanation');
    const explanationText = document.getElementById('explanation-text');

    // 设置结果图标和文本
    if (isCorrect) {
        resultIcon.textContent = '✅';
        resultText.textContent = '回答正确！';
        resultText.style.color = '#059669';
    } else {
        resultIcon.textContent = '❌';
        resultText.textContent = '回答错误！';
        resultText.style.color = '#dc2626';
    }

    // 显示答案
    let correctAnswerText = '';
    let userAnswerText = '';

    if (question.type === 'multiple') {
        correctAnswerText = question.answer.join(', ');
        userAnswerText = Array.isArray(userAnswer) ? userAnswer.join(', ') : userAnswer;
    } else {
        correctAnswerText = question.answer;
        userAnswerText = userAnswer;
    }

    correctAnswerSpan.textContent = correctAnswerText;
    userAnswerSpan.textContent = userAnswerText;

    // 显示解析（如果有）
    if (question.explanation) {
        explanationText.textContent = question.explanation;
        explanationDiv.style.display = 'block';
    } else {
        explanationDiv.style.display = 'none';
    }

    // 标记选项颜色
    document.querySelectorAll('.option').forEach(opt => {
        const key = opt.dataset.key;
        if (question.type === 'multiple') {
            if (question.answer.includes(key)) {
                opt.classList.add('correct');
            }
            if (Array.isArray(userAnswer) && userAnswer.includes(key) && !question.answer.includes(key)) {
                opt.classList.add('wrong');
            }
        } else {
            if (key === question.answer) {
                opt.classList.add('correct');
            }
            if (key === userAnswer && key !== question.answer) {
                opt.classList.add('wrong');
            }
        }
    });

    // 显示结果卡片
    resultCard.style.display = 'block';
    
    // 切换按钮
    document.getElementById('submit-btn').style.display = 'none';
    document.getElementById('next-btn').style.display = 'inline-block';
}

// 下一题
function nextQuestion() {
    currentQuestionIndex++;
    
    if (currentQuestionIndex >= window.currentQuizQuestions.length) {
        // 刷题结束
        finishQuiz();
        return;
    }
    
    displayQuestion();
}

// 完成刷题
function finishQuiz() {
    const totalTime = Math.round((Date.now() - quizStartTime) / 1000 / 60);
    stats.studyTime += totalTime;
    
    const correctCount = userAnswers.filter(a => a.isCorrect).length;
    const totalCount = userAnswers.length;
    const accuracy = Math.round((correctCount / totalCount) * 100);
    
    alert(`刷题完成！\n答对：${correctCount}/${totalCount}\n正确率：${accuracy}%\n用时：${totalTime}分钟`);
    
    saveStats();
    showPage('home');
}

// 添加到错题库
function addToWrongQuestions(question, userAnswer) {
    // 检查是否已存在
    const existingIndex = wrongQuestions.findIndex(wq => wq.questionId === question.id);
    
    const wrongItem = {
        questionId: question.id,
        userAnswer: userAnswer,
        correctAnswer: question.answer,
        timestamp: Date.now(),
        attempts: 1
    };

    if (existingIndex >= 0) {
        wrongQuestions[existingIndex].attempts++;
        wrongQuestions[existingIndex].timestamp = Date.now();
    } else {
        wrongQuestions.push(wrongItem);
    }

    localStorage.setItem('wrongQuestions', JSON.stringify(wrongQuestions));
    updateUI();
}

// 显示错题库
function displayWrongQuestions() {
    const wrongList = document.getElementById('wrong-list');
    wrongList.innerHTML = '';

    if (wrongQuestions.length === 0) {
        wrongList.innerHTML = '<div style="text-align: center; padding: 2rem; color: #6b7280;">暂无错题</div>';
        return;
    }

    wrongQuestions.forEach(wrongItem => {
        const question = questions.find(q => q.id === wrongItem.questionId);
        if (!question) return;

        const wrongDiv = document.createElement('div');
        wrongDiv.className = 'wrong-item';
        
        const date = new Date(wrongItem.timestamp).toLocaleDateString();
        
        wrongDiv.innerHTML = `
            <div class="wrong-item-header">
                <span class="wrong-item-type">${getQuestionTypeText(question.type)}</span>
                <span class="wrong-item-date">${date}</span>
            </div>
            <div class="wrong-item-question">${question.question}</div>
            <div class="wrong-item-answers">
                <p><strong>您的答案：</strong><span class="wrong-answer">${Array.isArray(wrongItem.userAnswer) ? wrongItem.userAnswer.join(', ') : wrongItem.userAnswer}</span></p>
                <p><strong>正确答案：</strong><span class="correct-answer">${Array.isArray(wrongItem.correctAnswer) ? wrongItem.correctAnswer.join(', ') : wrongItem.correctAnswer}</span></p>
                <p><strong>错误次数：</strong>${wrongItem.attempts}</p>
            </div>
        `;

        wrongList.appendChild(wrongDiv);
    });
}

// 清空错题库
function clearWrongQuestions() {
    if (confirm('确定要清空错题库吗？')) {
        wrongQuestions = [];
        localStorage.removeItem('wrongQuestions');
        updateUI();
        displayWrongQuestions();
    }
}

// 显示统计信息
function displayStats() {
    document.getElementById('total-answered').textContent = stats.totalAnswered;
    document.getElementById('correct-rate').textContent = 
        stats.totalAnswered > 0 ? Math.round((stats.correctAnswers / stats.totalAnswered) * 100) + '%' : '0%';
    document.getElementById('wrong-total').textContent = wrongQuestions.length;
    document.getElementById('study-time').textContent = stats.studyTime;
}

// 获取题型文本
function getQuestionTypeText(type) {
    switch (type) {
        case 'single': return '单选题';
        case 'multiple': return '多选题';
        case 'judge': return '判断题';
        default: return '未知题型';
    }
}

// 加载存储的数据
function loadStoredData() {
    // 加载题目
    const storedQuestions = localStorage.getItem('questions');
    if (storedQuestions) {
        questions = JSON.parse(storedQuestions);
    }

    // 加载错题
    const storedWrongQuestions = localStorage.getItem('wrongQuestions');
    if (storedWrongQuestions) {
        wrongQuestions = JSON.parse(storedWrongQuestions);
    }

    // 加载统计
    const storedStats = localStorage.getItem('stats');
    if (storedStats) {
        stats = { ...stats, ...JSON.parse(storedStats) };
    }
}

// 保存统计数据
function saveStats() {
    localStorage.setItem('stats', JSON.stringify(stats));
}

