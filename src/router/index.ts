import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../views/HomePage.vue'
import TryToolPage from '../views/TryToolPage.vue'
import BlogPage from '../views/BlogPage.vue'
import ExamplesPage from '../views/ExamplesPage.vue'
import DemoVideosPage from '../views/DemoVideosPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage
    },
    {
      path: '/try-tool',
      name: 'try-tool',
      component: TryToolPage
    },
    {
      path: '/blog',
      name: 'blog',
      component: BlogPage
    },
    {
      path: '/examples',
      name: 'examples',
      component: ExamplesPage
    },
    {
      path: '/demo-videos',
      name: 'demo-videos',
      component: DemoVideosPage
    }
  ]
})

export default router
