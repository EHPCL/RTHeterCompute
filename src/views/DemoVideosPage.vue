<script setup lang="ts">
// Demo Videos Page Component
import { useLanguage } from '../composables/useLanguage'

const { t } = useLanguage()
</script>

<template>
  <div class="demo-videos-page">
    <div class="container">
      <h1 class="page-title">{{ t('demoVideos.title') }}</h1>
      
      <div class="video-section">
        <h2 class="section-title">{{ t('demoVideos.caseStudyTitle') }}</h2>
        <div class="video-container">
          <video controls class="demo-video">
            <source src="../assets/RTHeterogeneousCompute.mp4" type="video/mp4">
            {{ t('demoVideos.browserNotSupport') }}
          </video>
        </div>
        <div class="video-description">
          <h3>{{ t('demoVideos.videoTitle') }}</h3>
          <p>
            {{ t('demoVideos.description1') }}
          </p>
          <p>
            {{ t('demoVideos.description2') }}
          </p>
          <p>
            {{ t('demoVideos.description3') }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.demo-videos-page {
  min-height: 100vh;
  padding: 2rem 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.page-title {
  font-size: 2.5rem;
  font-weight: bold;
  text-align: center;
  margin-bottom: 3rem;
  color: var(--text-primary);
}

.video-section {
  background-color: var(--bg-glass);
  border-radius: 8px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--border-color);
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: var(--primary-color);
}

.video-container {
  margin-bottom: 2rem;
  display: flex;
  justify-content: center;
}

.demo-video {
  width: 100%;
  max-width: 800px;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.video-description {
  max-width: 800px;
  margin: 0 auto;
}

.video-description h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--text-primary);
}

.video-description p {
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 1rem;
  color: var(--text-secondary);
}
</style>