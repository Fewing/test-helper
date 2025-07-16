<template>
  <nav class="navbar">
    <div class="nav-container">
      <div class="nav-brand">
        <h1>📚 智能刷题系统</h1>
      </div>
      <div class="nav-menu">
        <RouterLink 
          v-for="item in navItems" 
          :key="item.name"
          :to="item.path" 
          class="nav-btn"
          :class="{ active: $route.name === item.name }"
        >
          {{ item.label }}
        </RouterLink>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'

const navItems = [
  { name: 'home', path: '/', label: '首页' },
  { name: 'quiz', path: '/quiz', label: '刷题' },
  { name: 'wrong', path: '/wrong', label: '错题库' },
  { name: 'stats', path: '/stats', label: '统计' }
]
</script>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 70px;
}

.nav-brand h1 {
  margin: 0;
  font-size: 1.5rem;
  color: #2563eb;
  font-weight: 700;
}

.nav-menu {
  display: flex;
  gap: 1rem;
}

.nav-btn {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  text-decoration: none;
  color: #64748b;
  font-weight: 500;
  transition: all 0.2s;
}

.nav-btn:hover {
  background: #f1f5f9;
  color: #2563eb;
}

.nav-btn.active {
  background: #2563eb;
  color: white;
}

@media (max-width: 768px) {
  .nav-container {
    padding: 0 1rem;
  }
  
  .nav-brand h1 {
    font-size: 1.2rem;
  }
  
  .nav-menu {
    gap: 0.5rem;
  }
  
  .nav-btn {
    padding: 0.4rem 0.8rem;
    font-size: 0.9rem;
  }
}
</style>

