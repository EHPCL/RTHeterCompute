import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true // 允许所有主机访问，解决certbot验证问题
  },
  base: '/RTHeterCompute/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          monaco: ['monaco-editor'],
          vendor: ['vue', 'vue-router', 'vue-i18n']
        }
      }
    }
  }
})
