<template>
  <div class="home-page">
    <section class="hero">
      <h1>{{ t('home.title') }}</h1>
      <p>{{ t('home.subtitle') }}</p>
      <div class="quick-links">
        <router-link to="/try-tool" class="link-button primary-button">{{ t('home.tryTool') }} ➜</router-link>
        <a href="#about" class="link-button">{{ t('home.introduction') }}</a>
      </div>
    </section>
    <section class="about" id="about">
      <h2>{{ t('home.about.title') }}</h2>
      <p>{{ t('home.about.description') }}</p>
    </section>

    <section class="features">
      <h2>{{ t('home.features.title') }}</h2>
      <div class="feature-grid">
        <div class="feature-card glass-card">
          <h3>{{ t('home.features.processorModels.title') }}</h3>
          <p>{{ t('home.features.processorModels.description') }}</p>
        </div>
        <div class="feature-card glass-card">
          <h3>{{ t('home.features.taskModels.title') }}</h3>
          <p>{{ t('home.features.taskModels.description') }}</p>
        </div>
        <div class="feature-card glass-card">
          <h3>{{ t('home.features.rlSupport.title') }}</h3>
          <p>{{ t('home.features.rlSupport.description') }}</p>
        </div>
        <div class="feature-card glass-card">
          <h3>{{ t('home.features.sliceTickModel.title') }}</h3>
          <p>{{ t('home.features.sliceTickModel.description') }}</p>
        </div>
      </div>
    </section>

    <section class="how-it-works">
      <h2>{{ t('home.howItWorks.title') }}</h2>
      <div class="workflow-steps">
        <router-link to="/try-tool" class="step-link">
          <div class="step-card glass-card">
            <div class="step-number">1</div>
            <h3>{{ t('home.howItWorks.steps.configureHardware.title') }}</h3>
            <p>{{ t('home.howItWorks.steps.configureHardware.description') }}</p>
          </div>
        </router-link>
        <router-link to="/try-tool" class="step-link">
          <div class="step-card glass-card">
            <div class="step-number">2</div>
            <h3>{{ t('home.howItWorks.steps.defineTasks.title') }}</h3>
            <p>{{ t('home.howItWorks.steps.defineTasks.description') }}</p>
          </div>
        </router-link>
        <router-link to="/try-tool" class="step-link">
          <div class="step-card glass-card">
            <div class="step-number">3</div>
            <h3>{{ t('home.howItWorks.steps.runSimulation.title') }}</h3>
            <p>{{ t('home.howItWorks.steps.runSimulation.description') }}</p>
          </div>
        </router-link>
        <router-link to="/try-tool" class="step-link">
          <div class="step-card glass-card">
            <div class="step-number">4</div>
            <h3>{{ t('home.howItWorks.steps.analyzeResults.title') }}</h3>
            <p>{{ t('home.howItWorks.steps.analyzeResults.description') }}</p>
          </div>
        </router-link>
      </div>
    </section>



    <section class="contact">
      <h2>{{ t('home.contact.title') }}</h2>
      <p>{{ t('home.contact.description') }}</p>
      <a href="mailto:RTHeterogeneousCompute@outlook.com" class="contact-email">{{ t('home.contact.email') }}</a>
    </section>
  </div>
</template>

<script setup lang="ts">
// HomePage component logic
import { useLanguage } from '../composables/useLanguage'

const { t } = useLanguage()
</script>

<style scoped>
.home-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.hero {
  text-align: center;
  margin-bottom: 4rem;
  padding: 3rem 0;
}

.hero h1 {
  font-size: 3.5rem;
  margin-bottom: 1rem;
  color: var(--primary-color);
  text-shadow: 0 0 10px var(--primary-glow);
}

.hero p {
  font-size: 1.5rem;
  margin-bottom: 2.5rem;
  color: var(--text-secondary);
}

.quick-links {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  flex-wrap: wrap;
}

.link-button {
  padding: 1rem 2rem;
  background-color: var(--bg-glass);
  color: var(--text-primary);
  text-decoration: none;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  transition: var(--transition);
  font-weight: 500;
  backdrop-filter: blur(10px);
}

.link-button:hover {
  background-color: var(--bg-glass-hover);
  box-shadow: 0 0 15px var(--primary-glow);
  transform: translateY(-2px);
}

.primary-button {
  background-color: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.primary-button:hover {
  background-color: var(--bg-glass-hover);
  color: var(--primary-color);
  box-shadow: 0 0 15px var(--primary-glow);
  transform: translateY(-2px);
}

.about {
  margin-bottom: 4rem;
  text-align: center;
}

.about h2, .features h2, .download h2 {
  font-size: 2.5rem;
  margin-bottom: 1.5rem;
  text-align: center;
  color: var(--text-primary);
}

.about p {
  font-size: 1.25rem;
  color: var(--text-secondary);
  max-width: 800px;
  margin: 0 auto;
}

.features {
  margin-bottom: 4rem;
}

.feature-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 2rem;
  }

.feature-card {
  padding: 2rem;
}

.feature-card:hover {
  transform: translateY(-5px);
}

.feature-card h3 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: var(--primary-color);
}

.feature-card p {
  color: var(--text-secondary);
}

.download {
  text-align: center;
  margin-bottom: 4rem;
}

.download-button {
  padding: 1.25rem 2.5rem;
  background-color: var(--bg-glass);
  color: var(--text-primary);
  text-decoration: none;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 1.25rem;
  font-weight: 500;
  transition: var(--transition);
  backdrop-filter: blur(10px);
}

.download-button:hover {
  background-color: var(--bg-glass-hover);
  box-shadow: 0 0 15px var(--primary-glow);
  transform: translateY(-2px);
}

.how-it-works {
  margin-bottom: 4rem;
}

.workflow-steps {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
  margin-top: 2rem;
}

.step-card {
  padding: 2rem;
  position: relative;
  overflow: hidden;
}

.step-card:hover {
  transform: translateY(-5px);
}

.step-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background-color: var(--bg-glass);
  color: var(--primary-color);
  border-radius: 50%;
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1rem;
  border: 2px solid var(--primary-color);
}

.step-card h3 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: var(--text-primary);
}

.step-card p {
  color: var(--text-secondary);
}

.contact {
  margin-bottom: 4rem;
  text-align: center;
}

.contact h2 {
  font-size: 2.5rem;
  margin-bottom: 1.5rem;
  text-align: center;
  color: var(--text-primary);
}

.contact p {
  font-size: 1.25rem;
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
}

.contact-email {
  display: inline-block;
  font-size: 1.5rem;
  color: var(--primary-color);
  text-decoration: none;
  padding: 1rem 2rem;
  background-color: var(--bg-glass);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  transition: var(--transition);
  backdrop-filter: blur(10px);
}

.contact-email:hover {
  background-color: var(--bg-glass-hover);
  box-shadow: 0 0 15px var(--primary-glow);
  transform: translateY(-2px);
}
</style>
