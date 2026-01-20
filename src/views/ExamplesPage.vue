<script setup lang="ts">
import { ref } from 'vue'
// import { useLanguage } from '../composables/useLanguage'

// const { t } = useLanguage()

// Example case interface
interface ExampleCase {
  id: number
  title: string
  authors: string
  publication: string
  year: number
  abstract: string
  configuration: {
    hardware: string
    tasks: string
    scheduler: string
  }
  results: string[]
  paperUrl: string
}

// Mock example cases data
const exampleCases = ref<ExampleCase[]>([
  {
    id: 1,
    title: "RTGPU: Real-Time GPU Scheduling of Hard Deadline Parallel Tasks With Fine-Grain Utilization",
    authors: "An Zou, Jing Li, Christopher D. Gill, and Xuan Zhang",
    publication: "IEEE Transactions on Parallel and Distributed Systems",
    year: 2023,
    abstract: "A real-time GPU scheduling framework that combines fine-grained GPU partitioning with a novel federated and fixed-priority scheduling algorithm, providing hard deadline guarantees for parallel GPU tasks.",
    configuration: {
      hardware: "1 CPU + 1 DATACOPY + 1 GPU",
      tasks: "5 parallel GPU tasks with memory copy, under suspension model",
      scheduler: "Fixed priority"
    },
    results: [
      "System throughput improvement: 11-37%",
      "Schedulability improvement: up to 57% over prior work",
      "Overhead of GPU partitioning: ~10μs"
    ],
    paperUrl: "https://ieeexplore.ieee.org/stamp/stamp.jsp?tp=&arnumber=10012550"
  },
  {
    id: 2,
    title: "Real-Time Scheduling and Analysis of Fixed-Priority Tasks on a Basic Heterogeneous Architecture With Multiple CPUs and Many PEs",
    authors: "Yuankai Xu, Yinchen Ni, Tiancheng He, Ruiqi Sun, Yier Jin, An Zou",
    publication: "IEEE Transactions on Computers",
    year: 2025,
    abstract: "Proposes a multi-granularity real-time scheduling and response time analysis framework for accelerator-based heterogeneous architectures with multiple CPUs and many processing elements (PEs). The approach integrates federated scheduling for PEs and fixed-priority scheduling for CPUs, and provides schedulability analysis from unit-level (micro), segment-level (meso), and job-level (macro) perspectives.",
    configuration: {
      hardware: "2-4 CPUs + 5 GPUs",
      tasks: "Periodic tasks with multiple CPU and PE segments",
      scheduler: "Fixed priority"
    },
    results: [
      "Schedulability improvement: 10.3% to 52.9% over state-of-the-art",
      "Pessimism reduction vs. real system: up to 30.7%",
      "Combined multi-view analysis outperforms any single view",
    ],
    paperUrl: "https://ieeexplore.ieee.org/stamp/stamp.jsp?tp=&arnumber=11015906"
  },
  {
    id: 3,
    title: "RICH: Heterogeneous Computing for Real-Time Intelligent Control",
    authors: "Jintao Chen, Yuankai Xu, Yinchen Ni, An Zou, Yehan Ma",
    publication: "Design, Automation & Test in Europe Conference (DATE)",
    year: 2025,
    abstract: "An end-to-end framework for deploying intelligent control tasks (e.g., DNNs) on heterogeneous platforms. It combines offline Control-oriented Computation and Resource Mapping (CCRM) for control performance optimization and runtime Most Remaining Accelerator Segment Number First (MRAF) scheduling to ensure timing guarantees.",
    configuration: {
      hardware: "1 CPU core + 5 GPUs",
      tasks: "Intelligent control tasks (CNN-based)",
      scheduler: "Most Accelerator Segment First"
    },
    results: [
      "Control performance improvement: up to 50.71% with CCRM",
      "Control cost reduction with MRAF vs. EDF: up to 55.07%",
      "Real-time HIL simulator (RTICS) built with < 3 ms network latency"
    ],
    paperUrl: "https://ieeexplore.ieee.org/stamp/stamp.jsp?tp=&arnumber=10993261"
  },
  {
    id: 4,
    title: "MATCH: Real-Time Scheduling of Multiple and Parallel Data Copies in Heterogeneous Architectures",
    authors: "Yinchen Ni, Yuankai Xu, Jintao Chen, Jing Li, Chris Gill, Xuan Zhang, Yier Jin, An Zou",
    publication: "IEEE Real-Time and Embedded Technology and Applications Symposium (RTAS)",
    year: 2025,
    abstract: "Real-time scheduling and response time analysis framework for heterogeneous architectures with multiple and parallel data copy engines (CEs). The approach supports scheduling of multiple CPU cores, many PEs, and concurrent host-to-device (HE) and device-to-host (DE) data transfers, with cross-granularity analysis in spatial and temporal dimensions.",
    configuration: {
      hardware: " Mutiple CPUs + DataCopies + GPUs",
      tasks: "Periodic tasks with multiple CPU, PE, and data copy segments",
      scheduler: "Fixed priority"
    },
    results: [
      "Schedulability improvement: up to 144.4% over state-of-the-art methods",
      "Supports multiple parallel data copies (e.g., 2 HEs + 2 DEs)",
      "Validated with GEMM and neural network workloads"
    ],
    paperUrl: "https://ieeexplore.ieee.org/stamp/stamp.jsp?tp=&arnumber=11018764"
  },
  {
    id: 5,
    title: "HARD: Hardening Real-Time Scheduling and Analysis for Accelerator Enabled Computing",
    authors: "Yinchen Ni, Tianrui Ma, Jintao Chen, Chongye Yang, Siwei Ye, Yuankai Xu, Yier Jin, An Zou",
    publication: "IEEE Real-Time and Embedded Technology and Applications Symposium (RTAS)",
    year: 2025,
    abstract: "HARD integrates timeslot allocation, response-time analysis, and a practical OS scheduler for accelerator-enabled architectures. The approach leverages subtask-level scheduling granularity to bridge the gap between theoretical worst-case schedulability (HRT) and average measured schedulability (AMS), reducing pessimism and improving timing guarantees.",
    configuration: {
      hardware: "Multiple CPUs + Multiple PEs",
      tasks: "Periodic multi-segment tasks with CPU and accelerator workloads",
      scheduler: "Timeslot Allocation with user-definable Granularity (TAG)"
    },
    results: [
      "Hard real-time schedulability improvement: 11.3% over state-of-the-art",
      "Scalable to neural network workloads, HRT improvement up to 27.3%",
      "Compatible with multi-CPU and multi-accelerator systems"
    ],
    paperUrl: "https://ieeexplore.ieee.org/document/11018775"
  },
  {
    id: 6,
    title: "FALCON: FPGA Accelerated Real-Time Intelligent Controller for Autonomous Systems",
    authors: "Siwei Ye, Jintao Chen, Yehan Ma, An Zou",
    publication: "IEEE Real-Time System Symposium (RTSS)",
    year: 2025,
    abstract: "An algorithm-hardware co-design framework for FPGA-accelerated real-time intelligent controllers in autonomous systems. The approach integrates DNN-based control, FPGA resource allocation, and performance modeling to optimize control performance under timing and resource constraints.",
    configuration: {
      hardware: "2 CPUs + 2 FPGA IP Cores",
      tasks: "Multiple real-time control tasks with DNN-based intelligent controllers",
      scheduler: "Fixed-priority"
    },
    results: [
      "Worst-case response time reduction: up to 46.52%",
      "Power efficiency improvement: 3.67x vs. DNN on TX2, 30.78x vs. MPC on CPU",
      "Supports multi-task concurrent execution with hard real-time guarantees",
    ],
    paperUrl: "https://ieeexplore.ieee.org/document/11315118"
  }
])
</script>

<template>
  <div class="examples-page">
    <header class="examples-header">
      <h1>Papers</h1>
      <p>Research papers and case studies</p>
    </header>

    <main class="examples-content">
      <!-- Real-Time Scheduler Design -->
      <section class="paper-category">
        <h2>Real-Time Scheduler Design</h2>
        <div class="category-grid">
          <div 
            v-for="exampleCase in exampleCases.filter(c => c.title.includes('RTGPU') || c.title.includes('HARD'))" 
            :key="exampleCase.id" 
            class="case-card glass-card"
          >
            <div class="case-header">
              <h3 class="case-title">{{ exampleCase.title }}</h3>
              <div class="case-meta">
                <span class="authors">{{ exampleCase.authors }}</span>
                <span class="publication">{{ exampleCase.publication }}</span>
                <span class="year">{{ exampleCase.year }}</span>
              </div>
            </div>

            <div class="case-abstract">
              <p>{{ exampleCase.abstract }}</p>
            </div>

            <div class="case-configuration">
              <h4>Configuration</h4>
              <div class="config-grid">
                <div class="config-item">
                  <strong>Hardware:</strong>
                  <span>{{ exampleCase.configuration.hardware }}</span>
                </div>
                <div class="config-item">
                  <strong>Tasks:</strong>
                  <span>{{ exampleCase.configuration.tasks }}</span>
                </div>
                <div class="config-item">
                  <strong>Scheduler:</strong>
                  <span>{{ exampleCase.configuration.scheduler }}</span>
                </div>
              </div>
            </div>

            <div class="case-results">
              <h4>Results</h4>
              <ul>
                <li v-for="(result, index) in exampleCase.results" :key="index">
                  {{ result }}
                </li>
              </ul>
            </div>

            <div class="case-footer">
              <a 
                :href="exampleCase.paperUrl" 
                target="_blank" 
                rel="noopener noreferrer"
                class="paper-link"
              >
                <span>Read Paper</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15 3 21 3 21 9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- Response Time Analysis Framework -->
      <section class="paper-category">
        <h2>Response Time Analysis Framework</h2>
        <div class="category-grid">
          <div 
            v-for="exampleCase in exampleCases.filter(c => c.title.includes('Real-Time Scheduling') || c.title.includes('MATCH'))" 
            :key="exampleCase.id" 
            class="case-card glass-card"
          >
            <div class="case-header">
              <h3 class="case-title">{{ exampleCase.title }}</h3>
              <div class="case-meta">
                <span class="authors">{{ exampleCase.authors }}</span>
                <span class="publication">{{ exampleCase.publication }}</span>
                <span class="year">{{ exampleCase.year }}</span>
              </div>
            </div>

            <div class="case-abstract">
              <p>{{ exampleCase.abstract }}</p>
            </div>

            <div class="case-configuration">
              <h4>Configuration</h4>
              <div class="config-grid">
                <div class="config-item">
                  <strong>Hardware:</strong>
                  <span>{{ exampleCase.configuration.hardware }}</span>
                </div>
                <div class="config-item">
                  <strong>Tasks:</strong>
                  <span>{{ exampleCase.configuration.tasks }}</span>
                </div>
                <div class="config-item">
                  <strong>Scheduler:</strong>
                  <span>{{ exampleCase.configuration.scheduler }}</span>
                </div>
              </div>
            </div>

            <div class="case-results">
              <h4>Results</h4>
              <ul>
                <li v-for="(result, index) in exampleCase.results" :key="index">
                  {{ result }}
                </li>
              </ul>
            </div>

            <div class="case-footer">
              <a 
                :href="exampleCase.paperUrl" 
                target="_blank" 
                rel="noopener noreferrer"
                class="paper-link"
              >
                <span>Read Paper</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15 3 21 3 21 9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- Scheduling Optimized Applications -->
      <section class="paper-category">
        <h2>Scheduling Optimized Applications</h2>
        <div class="category-grid">
          <div 
            v-for="exampleCase in exampleCases.filter(c => c.title.includes('RICH') || c.title.includes('FALCON'))" 
            :key="exampleCase.id" 
            class="case-card glass-card"
          >
            <div class="case-header">
              <h3 class="case-title">{{ exampleCase.title }}</h3>
              <div class="case-meta">
                <span class="authors">{{ exampleCase.authors }}</span>
                <span class="publication">{{ exampleCase.publication }}</span>
                <span class="year">{{ exampleCase.year }}</span>
              </div>
            </div>

            <div class="case-abstract">
              <p>{{ exampleCase.abstract }}</p>
            </div>

            <div class="case-configuration">
              <h4>Configuration</h4>
              <div class="config-grid">
                <div class="config-item">
                  <strong>Hardware:</strong>
                  <span>{{ exampleCase.configuration.hardware }}</span>
                </div>
                <div class="config-item">
                  <strong>Tasks:</strong>
                  <span>{{ exampleCase.configuration.tasks }}</span>
                </div>
                <div class="config-item">
                  <strong>Scheduler:</strong>
                  <span>{{ exampleCase.configuration.scheduler }}</span>
                </div>
              </div>
            </div>

            <div class="case-results">
              <h4>Results</h4>
              <ul>
                <li v-for="(result, index) in exampleCase.results" :key="index">
                  {{ result }}
                </li>
              </ul>
            </div>

            <div class="case-footer">
              <a 
                :href="exampleCase.paperUrl" 
                target="_blank" 
                rel="noopener noreferrer"
                class="paper-link"
              >
                <span>Read Paper</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15 3 21 3 21 9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.examples-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.examples-header {
  text-align: center;
  margin-bottom: 4rem;
}

.examples-header h1 {
  font-size: 3rem;
  margin-bottom: 0.5rem;
  color: var(--primary-color);
}

.examples-header p {
  font-size: 1.25rem;
  color: var(--text-secondary);
}

.paper-category {
  margin-bottom: 4rem;
}

.paper-category h2 {
  font-size: 2rem;
  margin-bottom: 2rem;
  color: var(--primary-color);
  border-bottom: 2px solid var(--primary-color);
  padding-bottom: 0.5rem;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
}

.case-card {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.case-header {
  margin-bottom: 1.5rem;
}

.case-title {
  font-size: 1.35rem;
  margin-bottom: 0.75rem;
  color: var(--text-primary);
  line-height: 1.4;
}

.case-meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.authors {
  font-style: italic;
}

.case-abstract {
  margin-bottom: 1.5rem;
}

.case-abstract p {
  color: var(--text-secondary);
  line-height: 1.6;
  font-size: 0.95rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.case-configuration {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: var(--bg-glass);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.case-configuration h4 {
  margin-bottom: 0.75rem;
  color: var(--primary-color);
  font-size: 1rem;
}

.config-grid {
  display: grid;
  gap: 0.5rem;
}

.config-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.config-item strong {
  color: var(--text-secondary);
  font-weight: bold;
}

.case-results {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: var(--bg-glass);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  flex-grow: 1;
}

.case-results h4 {
  margin-bottom: 0.75rem;
  color: var(--primary-color);
  font-size: 1rem;
}

.case-results ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.case-results li {
  position: relative;
  padding-left: 1.25rem;
  margin-bottom: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.5;
}

.case-results li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: var(--primary-color);
  font-weight: bold;
}

.case-footer {
  margin-top: auto;
}

.paper-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: var(--bg-glass);
  color: var(--primary-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  text-decoration: none;
  font-weight: 500;
  transition: var(--transition);
  width: 100%;
  justify-content: center;
}

.paper-link:hover {
  background-color: var(--bg-glass-hover);
  color: var(--text-primary);
  box-shadow: 0 0 15px var(--primary-glow);
}

@media (max-width: 1200px) {
  .category-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}

@media (max-width: 768px) {
  .examples-page {
    padding: 1rem;
  }

  .examples-header h1 {
    font-size: 2.5rem;
  }

  .paper-category h2 {
    font-size: 1.5rem;
  }

  .category-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .case-card {
    padding: 1.5rem;
  }

  .case-title {
    font-size: 1.25rem;
  }
}
</style>