<script setup lang="ts">
import { reactive, ref } from 'vue'
import HardwareConfigPanel from '../components/HardwareConfigPanel.vue'
import TasksetConfigPanel from '../components/TasksetConfigPanel.vue'
import RunControlPanel from '../components/RunControlPanel.vue'
import type { SimulationConfig, SimulationResult } from '../types/api'

// Step management
const currentStep = ref(1)
const totalSteps = 3

// Navigation functions
const goToNextStep = () => {
  confirmNavigation(() => {
    if (currentStep.value < totalSteps) {
      currentStep.value++
    }
  })
}

const goToPrevStep = () => {
  confirmNavigation(() => {
    if (currentStep.value > 1) {
      currentStep.value--
    }
  })
}

// Step title helper
const getStepTitle = (step: number) => {
  switch (step) {
    case 1: return 'Hardware'
    case 2: return 'Task'
    case 3: return 'Run'
    default: return ''
  }
}

// Simulation configuration
const simulationConfig = reactive<SimulationConfig>({
  hardware: { processors: [
    { type: 'CPU', count: 1, preemptive: true },
    { type: 'GPU', count: 1, preemptive: false }
  ] },
  taskset: {
    taskCount: 5,
    taskModel: 'DAG',
    edgeDensity: 0.2,
    utilization: 1.0,
    randomSeed: 1,
    segmentNumber: 10,
    segmentLengthMin: 1,
    segmentLengthMax: 10,
    releaseTimes: 10000,
    genMethod: 'User'
  }
})

// Simulation results (to persist across step changes)
const simulationResults = reactive<SimulationResult>({
  hasDeadlineMiss: false,
  deadlineMisses: [],
  averageResponseTime: 0,
  worstResponseTime: 0,
  utilization: {},
  taskResponseStats: [],
  processorTimeline: [],
  trace: [],
  isSchedulable: true
})

// Uploaded tasks (to persist across step changes)
const uploadedTasks = ref<any[]>([])

// Simulation running state
const isSimulationRunning = ref(false)

// Handle simulation running state changes
const handleSimulationRunningChange = (isRunning: boolean) => {
  isSimulationRunning.value = isRunning
}

// Add beforeunload event listener to show confirmation when leaving page during simulation
window.onbeforeunload = function(e) {
  if (isSimulationRunning.value) {
    // Cancel the event (for older browsers)
    e.preventDefault()
    // Chrome requires returnValue to be set
    e.returnValue = ''
    return ''
  }
  // If not running, allow navigation without confirmation
  return undefined
}

// Navigation confirmation function
const confirmNavigation = (callback: () => void) => {
  if (isSimulationRunning.value) {
    if (confirm('Simulation is currently running. Leaving the page may cause the backend task to continue running and consume CPU resources. Are you sure you want to leave?')) {
      callback()
    }
  } else {
    callback()
  }
}

// Handle simulation finished event
const handleSimulationFinished = (result: SimulationResult) => {
  console.log('Simulation finished with results:', result)
  // Copy results to our persistent state
  Object.assign(simulationResults, result)
}


</script>

<template>
  <div class="try-tool-page">
    <header class="tool-header">
      <h1>Try the tool</h1>
      <p>Try RTComputeSimulator's capabilities in real-time</p>
    </header>

    <div class="tool-content">
      <!-- Step indicators -->
      <div class="step-indicators">
        <div 
            v-for="step in totalSteps" 
            :key="step" 
            class="step-indicator" 
            :class="{ active: currentStep === step }"
            @click="confirmNavigation(() => { currentStep = step })"
            style="cursor: pointer;"
          >
          <span class="step-number">{{ step }}</span>
          <span class="step-title">{{ getStepTitle(step) }}</span>
        </div>
      </div>

      <!-- Hardware Configuration (Step 1) -->
      <section v-if="currentStep === 1" class="config-panel glass-card">
        <h2>1. Hardware Configuration</h2>
        <HardwareConfigPanel v-model="simulationConfig.hardware" />
      </section>

      <!-- Task Configuration (Step 2) -->
      <section v-if="currentStep === 2" class="task-panel glass-card">
        <h2>2. Task Configuration</h2>
        <TasksetConfigPanel 
          v-model="simulationConfig.taskset" 
          :hardware-config="simulationConfig.hardware"
          @update:uploadedTasks="uploadedTasks = $event"
        />
      </section>

      <!-- Run Simulation (Step 3) -->
      <section v-if="currentStep === 3" class="run-panel glass-card">
        <h2>3. Run Simulation</h2>
        
        <!-- Configuration display boxes -->
        <div class="config-display-section">
          <div class="config-box">
            <h3>Current Processor Configuration</h3>
            <div class="config-content">
              <div v-if="simulationConfig.hardware.processors.length === 0" class="no-config">
                No processor configuration yet
              </div>
              <div v-else class="processor-list">
                <div v-for="(processor, index) in simulationConfig.hardware.processors" :key="index" class="processor-item">
                  <span class="processor-type">{{ processor.type }}</span>
                  <span class="processor-count">Count: {{ processor.count }}</span>
                  <span class="processor-preemptive">Preemptive: {{ processor.preemptive ? 'Yes' : 'No' }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="config-box">
            <h3>Current Task Configuration</h3>
            <div class="config-content">
              <div class="task-config-item">
                <span class="config-label">Task Count:</span>
                <span class="config-value">{{ simulationConfig.taskset.taskCount }}</span>
              </div>
              <div class="task-config-item">
                <span class="config-label">Task Model:</span>
                <span class="config-value">{{ simulationConfig.taskset.taskModel }}</span>
              </div>
              <div class="task-config-item">
                <span class="config-label">Utilization:</span>
                <span class="config-value">{{ simulationConfig.taskset.utilization }}</span>
              </div>
              <div class="task-config-item">
                <span class="config-label">Segment Number:</span>
                <span class="config-value">{{ simulationConfig.taskset.segmentNumber }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Navigation buttons -->
        <div class="modify-buttons">
          <button class="modify-btn" @click="confirmNavigation(() => { currentStep = 1 })">Modify Processor</button>
          <button class="modify-btn" @click="confirmNavigation(() => { currentStep = 2 })">Modify Task</button>
          <button class="save-config-btn">Save Config</button>
        </div>
        
        <RunControlPanel 
          :simulation-config="simulationConfig"
          :simulation-results="simulationResults"
          :userTaskset="uploadedTasks"
          @simulation:finished="handleSimulationFinished"
          @update:isRunning="handleSimulationRunningChange"
        />
      </section>

      <!-- Navigation buttons -->
      <div class="navigation-buttons">
        <button 
          v-if="currentStep > 1" 
          @click="goToPrevStep" 
          class="nav-button prev-button"
        >
          Prev Step ({{ getStepTitle(currentStep - 1) }})
        </button>
        <button 
          v-if="currentStep < totalSteps" 
          @click="goToNextStep" 
          class="nav-button next-button"
        >
          Next Step ({{ getStepTitle(currentStep + 1) }})
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.try-tool-page {
  max-width: 100%;
  margin: 0 auto;
  padding: 2rem;
}

.tool-header {
  text-align: center;
  margin-bottom: 3rem;
}

.tool-header h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.tool-header p {
  font-size: 1.25rem;
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
}

.template-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.template-btn {
  padding: 0.75rem 1.5rem;
  background-color: var(--bg-glass);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: var(--transition);
  backdrop-filter: blur(10px);
}

.template-btn:hover {
  background-color: var(--bg-glass-hover);
  box-shadow: 0 0 15px var(--primary-glow);
  transform: translateY(-2px);
  border-color: var(--border-hover);
}

.tool-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  margin-top: 2rem;
  width: 100%;
}

.step-indicators {
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
  justify-content: center;
}

.step-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  border-radius: 8px;
  background-color: var(--bg-glass);
  border: 1px solid var(--border-color);
  transition: var(--transition);
  min-width: 100px;
}

.step-indicator.active {
  background-color: var(--bg-glass-hover);
  border-color: var(--primary-color);
  box-shadow: 0 0 15px var(--primary-glow);
}

.step-number {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.step-title {
  font-size: 0.9rem;
  color: var(--text-secondary);
  text-align: center;
}

.navigation-buttons {
  display: flex;
  gap: 2rem;
  justify-content: center;
  margin-top: 2rem;
}

.nav-button {
  padding: 1rem 2rem;
  background-color: var(--bg-glass);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: var(--transition);
  backdrop-filter: blur(10px);
  font-size: 1rem;
  min-width: 150px;
}

.nav-button:hover {
  background-color: var(--bg-glass-hover);
  box-shadow: 0 0 15px var(--primary-glow);
  transform: translateY(-2px);
  border-color: var(--border-hover);
}

.next-button {
  background-color: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.next-button:hover {
  background-color: var(--primary-color);
  box-shadow: 0 0 20px var(--primary-glow);
}

.config-panel, .task-panel, .run-panel {
  padding: 2rem;
  min-height: 800px;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 1000px;
  box-sizing: border-box;
}

.config-panel h2, .task-panel h2, .run-panel h2 {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: var(--text-primary);
}

.config-panel p, .task-panel p, .run-panel p {
  color: var(--text-secondary);
}

/* Configuration display styles */
.config-display-section {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.config-box {
  flex: 1;
  min-width: 300px;
  background-color: rgba(255, 255, 255, 0.7);
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  backdrop-filter: blur(10px);
}

.config-box h3 {
  margin-bottom: 1rem;
  font-size: 1.1rem;
  color: var(--text-primary);
}

.config-content {
  font-size: 0.9rem;
}

.no-config {
  color: var(--text-secondary);
  font-style: italic;
}

.processor-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.processor-item {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    padding: 0.75rem;
    background-color: rgba(255, 255, 255, 0.8);
    border-radius: 6px;
    border-left: 3px solid var(--primary-color);
}

.processor-type {
    font-weight: bold;
    color: var(--primary-color);
}

.processor-count,
.processor-preemptive {
    color: var(--text-primary);
}

.task-config-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.config-label {
  color: var(--text-secondary);
}

.config-value {
  font-weight: bold;
  color: var(--text-primary);
}

/* Modify buttons styles */
.modify-buttons {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.modify-btn {
  padding: 0.75rem 1.5rem;
  background-color: white;
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  transition: var(--transition);
  font-size: 0.9rem;
  flex: 1;
  min-width: 120px;
}

.modify-btn:hover {
  background-color: rgba(255, 255, 255, 0.9);
  box-shadow: 0 0 10px rgba(139, 92, 246, 0.2);
  border-color: var(--primary-color);
}

.save-config-btn {
  padding: 0.75rem 1.5rem;
  background-color: var(--primary-color);
  color: white;
  border: 1px solid var(--primary-color);
  border-radius: 6px;
  cursor: pointer;
  transition: var(--transition);
  font-size: 0.9rem;
  flex: 1;
  min-width: 120px;
}

.save-config-btn:hover {
  background-color: var(--primary-color);
  box-shadow: 0 0 15px var(--primary-glow);
}
</style>
