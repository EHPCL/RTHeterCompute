<script setup lang="ts">
// import { useLanguage } from '../composables/useLanguage'
// import videoFile from '../assets/RTHeterogeneousCompute.mp4'

// const { t } = useLanguage()
const videoFile = 'https://github.com/EHPCL/RTHeterCompute/releases/download/demo_videos/RTHeterogeneousCompute-D8iY-EUv.mp4'
</script>

<template>
  <div class="demo-videos-page">
    <div class="container">
      <h1 class="page-title">Demo Videos</h1>
      
      <div class="video-section">
        <h2 class="section-title">Case Study: RL-driven Scheduling</h2>
        <div class="video-container">
          <video controls class="demo-video">
            <source :src="videoFile" type="video/mp4">
            Your browser does not support the video tag.
          </video>
        </div>
        <div class="video-description">
          <h3>Reinforcement Learning Scheduler Improves ViT and Language Model Task Scheduling</h3>
          <p>
            This demonstration video shows how RTComputeSimulator uses reinforcement learning scheduling to optimize the deployment of computationally intensive tasks such as Vision Transformers (ViT) and Language Models.
          </p>
          <p>
            Through intelligent scheduling algorithms, the system can dynamically adjust task allocation strategies based on task characteristics and hardware resource status, significantly improving the overall performance and resource utilization of heterogeneous computing systems.
          </p>
          <p>
            The video includes visualizations of the actual scheduling process and performance comparison analyses under different scheduling strategies, helping you intuitively understand the advantages of the reinforcement learning scheduler.
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