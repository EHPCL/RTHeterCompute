<script setup lang="ts">
// import { useLanguage } from '../composables/useLanguage'

// const { t, locale, languages, changeLanguage } = useLanguage()
</script>

<template>
  <header class="top-nav">
    <div class="logo-section">
      <router-link to="/" class="logo-link">
        <img src="../assets/logo.png" alt="RTComputeSimulator Logo" class="logo-img">
        <span class="logo">RTComputeSimulator</span>
      </router-link>
    </div>
    
    <nav class="main-nav">
      <router-link to="/" class="nav-link">Home</router-link>
      <router-link to="/try-tool" class="nav-link">Try the tool</router-link>
      <router-link to="/blog" class="nav-link">Blog</router-link>
      <router-link to="/examples" class="nav-link">Papers</router-link>
      <router-link to="/demo-videos" class="nav-link">Demo Videos</router-link>
    </nav>
    
    <div class="right-section">
      <div class="lang-switch">
        <!-- <button 
          v-for="lang in languages" 
          :key="lang.code" 
          class="lang-btn" 
          :class="{ active: locale === lang.code }"
          @click="changeLanguage(lang.code)"
        >
          {{ lang.name }}
        </button> -->
      </div>
    </div>
  </header>
</template>

<style scoped>
.top-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(99, 102, 241, 0.3);
  position: sticky;
  top: 0;
  z-index: 100;
}

.logo-section {
  display: flex;
  align-items: center;
}

.logo-link {
  text-decoration: none;
  color: #e2e8f0;
}

.logo-img {
  width: 32px;
  height: 32px;
  margin-right: 8px;
  vertical-align: middle;
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  color: #dedeee;
  vertical-align: middle;
}

.main-nav {
  display: flex;
  gap: 2rem;
}

.nav-link {
  text-decoration: none;
  color: #cbd5e1;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.nav-link:hover {
  color: #6366f1;
  background-color: rgba(0, 0, 4, 0.1);
}

.right-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.lang-switch {
  display: flex;
  gap: 0.5rem;
}

.lang-btn {
  padding: 0.5rem 1rem;
  background-color: rgba(59, 130, 246, 0.2);
  color: #e2e8f0;
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.lang-btn:hover {
  background-color: rgba(59, 130, 246, 0.4);
}

.lang-btn.active {
  background-color: rgba(59, 130, 246, 0.5);
  border-color: rgba(59, 130, 246, 0.7);
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
}
</style>