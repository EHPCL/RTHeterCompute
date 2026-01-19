<script setup lang="ts">
import TopNav from './components/TopNav.vue'
// App component logic
</script>

<template>
  <div class="app-container">
    <TopNav />
    
    <main class="app-main">
      <router-view />
    </main>
    
    <footer class="app-footer">
      <p>&copy; 2025 RTComputeSimulator. All rights reserved.</p>
    </footer>
  </div>
</template>

<style>
/* Global styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background-color: #ffffffff;
  color: #e2e8f0;
  line-height: 1.6;
}
</style>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-main {
  flex: 1;
  padding: 2rem;
}

.app-footer {
  text-align: center;
  padding: 1rem;
  background-color: rgba(15, 23, 42, 0.8);
  border-top: 1px solid rgba(99, 102, 241, 0.3);
  color: #94a3b8;
}
</style>
