<script setup lang="ts">
import { ref, computed } from 'vue'
import { useLanguage } from '../composables/useLanguage'

const { t } = useLanguage()

// Timeline milestone interface
interface Milestone {
  id: number
  date: string
  title: string
  description: string
  tags: string[]
}

// Mock timeline data
const milestones = ref<Milestone[]>([
  {
    id: 1,
    date: '2026-01-15',
    title: 'Demo Video Uploaded',
    description: 'Demonstrating RTComputeSimulator\'s end-to-end  capability of optimizing the real-time scheduling for real-world applications.',
    tags: ['Release']
  },
  {
    id: 2,
    date: '2026-01-01',
    title: 'Web UI Prototype Launched',
    description: 'First web-based user interface prototype released, providing visual configuration and real-time simulation monitoring.',
    tags: ['Release']
  },
  {
    id: 3,
    date: '2025-10-01',
    title: 'Embedded System Software Competition Award',
    description: 'RTComputeSimulator won second runner up award in the Embedded System Software Competition.',
    tags: ['Award', 'Publication']
  },
  {
    id: 4,
    date: '2025-04-05',
    title: 'Paper Publication at DATE 2025',
    description: 'Published a paper at DATE 2025 conference. DOI: <a href="https://doi.org/10.23919/DATE64628.2025.10992806" target="_blank" rel="noopener noreferrer">10.23919/DATE64628.2025.10992806</a>',
    tags: ['Publication']
  },
  {
    id: 5,
    date: '2024-08-15',
    title: 'RTComputeSimulator v1.0 Release',
    description: 'First internal release of RTComputeSimulator with core simulation capabilities for heterogeneous real-time systems.',
    tags: ['Release']
  },
  {
    id: 6,
    date: '2024-06-01',
    title: 'Project Initiation',
    description: 'RTComputeSimulator project officially started with the goal of developing a comprehensive real-time heterogeneous system simulator.',
    tags: []
  }
])

// Filter functionality
const selectedTag = ref<string | null>(null)

// Get all unique tags
const allTags = computed(() => {
  const tagsSet = new Set<string>()
  milestones.value.forEach(milestone => {
    milestone.tags.forEach(tag => tagsSet.add(tag))
  })
  return Array.from(tagsSet)
})

// Filtered milestones based on selected tag
const filteredMilestones = computed(() => {
  if (!selectedTag.value) {
    return milestones.value
  }
  return milestones.value.filter(milestone => 
    milestone.tags.includes(selectedTag.value!)
  )
})

// Filter handler
const handleFilterChange = (tag: string | null) => {
  selectedTag.value = tag
}
</script>

<template>
  <div class="blog-page">
    <header class="blog-header">
      <h1>{{ t('blog.title') }}</h1>
      <p>{{ t('blog.subtitle') }}</p>
      
      <!-- Tag filter -->
      <div class="tag-filter">
        <button 
          class="filter-btn"
          :class="{ active: !selectedTag }"
          @click="handleFilterChange(null)"
        >
          {{ t('blog.filter.all') }}
        </button>
        <button 
          v-for="tag in allTags" 
          :key="tag"
          class="filter-btn"
          :class="{ active: selectedTag === tag }"
          @click="handleFilterChange(tag)"
        >
          {{ tag }}
        </button>
      </div>
    </header>

    <main class="blog-content">
      <div class="timeline">
        <div 
          v-for="(milestone, index) in filteredMilestones" 
          :key="milestone.id" 
          class="timeline-item"
          :class="{ 'even': index % 2 === 0 }"
        >
          <div class="timeline-date">
            <div class="date-badge">{{ milestone.date }}</div>
          </div>
          <div class="timeline-line"></div>
          <div class="timeline-content">
            <div class="milestone-card">
              <h3 class="milestone-title">{{ milestone.title }}</h3>
              <p class="milestone-description" v-html="milestone.description"></p>
              <div class="milestone-tags">
                <span 
                  v-for="tag in milestone.tags" 
                  :key="tag" 
                  class="tag"
                >
                  {{ tag }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.blog-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.blog-header {
  text-align: center;
  margin-bottom: 4rem;
}

.blog-header h1 {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

.blog-header p {
  font-size: 1.25rem;
  color: var(--text-secondary);
  margin-bottom: 2rem;
}

/* Tag filter styles */
.tag-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: center;
  margin-bottom: 3rem;
}

.filter-btn {
  padding: 0.6rem 1.2rem;
  background-color: rgba(255, 255, 255, 0.9);
  color: rgba(99, 102, 241, 0.8);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
}

.filter-btn:hover {
  background-color: rgba(255, 255, 255, 1);
  color: var(--primary-color);
  box-shadow: 0 0 10px var(--primary-glow);
  border-color: var(--primary-color);
}

.filter-btn.active {
  background-color: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
  box-shadow: 0 0 15px var(--primary-glow);
}

.timeline {
  position: relative;
  padding: 2rem 0;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(to bottom, var(--primary-glow), rgba(99, 102, 241, 0.1));
  transform: translateX(-50%);
}

.timeline-item {
  position: relative;
  margin-bottom: 3rem;
  display: flex;
  align-items: center;
}

.timeline-item.even {
  flex-direction: row-reverse;
}

.timeline-date {
  width: 45%;
  text-align: center;
  padding: 0 2rem;
  z-index: 2;
}

.date-badge {
  display: inline-block;
  padding: 0.5rem 1rem;
  background-color: var(--bg-glass);
  color: var(--primary-color);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  font-weight: 600;
  backdrop-filter: blur(10px);
  transition: var(--transition);
  font-size: 0.9rem;
}

.date-badge:hover {
  background-color: var(--bg-glass-hover);
  box-shadow: 0 0 15px var(--primary-glow);
  transform: translateY(-2px);
  border-color: var(--border-hover);
}

.timeline-line {
  position: absolute;
  left: 50%;
  width: 16px;
  height: 16px;
  background-color: white;
  border: 2px solid var(--primary-color);
  border-radius: 50%;
  box-shadow: 0 0 10px var(--primary-glow);
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translateX(-50%);
}

.timeline-line::after {
  content: '';
  width: 6px;
  height: 6px;
  background-color: var(--primary-color);
  border-radius: 50%;
}

.timeline-content {
  width: 45%;
  padding: 0 2rem;
}

.milestone-card {
  background-color: var(--bg-glass);
  padding: 2rem;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  transition: var(--transition);
}

.milestone-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px var(--primary-glow);
  background-color: var(--bg-glass-hover);
  border-color: var(--border-hover);
}

.milestone-title {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: var(--text-primary);
}

.milestone-description {
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.milestone-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  padding: 0.3rem 0.8rem;
  background-color: rgba(255, 255, 255, 0.9);
  color: rgba(99, 102, 241, 0.8);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 15px;
  font-size: 0.85rem;
  font-weight: 500;
  transition: var(--transition);
}

.tag:hover {
  background-color: rgba(255, 255, 255, 1);
  color: var(--primary-color);
  box-shadow: 0 0 10px var(--primary-glow);
  border-color: var(--primary-color);
}

@media (max-width: 768px) {
  .blog-header h1 {
    font-size: 2.5rem;
  }

  .timeline::before {
    left: 30px;
  }

  .timeline-item,
  .timeline-item.even {
    flex-direction: column;
    align-items: flex-start;
    margin-left: 30px;
  }

  .timeline-date {
    width: 100%;
    text-align: left;
    padding: 0 0 0.5rem 0;
  }

  .timeline-line {
    left: 30px;
  }

  .timeline-content {
    width: 100%;
    padding: 0;
    margin-left: 30px;
  }

  .milestone-card {
    padding: 1.5rem;
  }
}
</style>