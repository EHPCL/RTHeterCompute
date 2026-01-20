<script setup lang="ts">
import { ref, reactive, onBeforeUnmount, onMounted, computed } from 'vue'
import type { SimulationConfig, SimulationProgress, SimulationResult } from '../types/api'
import * as monaco from 'monaco-editor'

const props = defineProps<{
  simulationConfig?: SimulationConfig
  simulationResults?: SimulationResult
  userTaskset?: any[]
}>()

const emit = defineEmits<{
  'simulation:finished': [result: SimulationResult],
  'update:isRunning': [isRunning: boolean]
}>()

// Backend server URL
const BACKEND_URL = 'http://121.41.69.219:5100'

// Scheduling algorithm options
type SchedulingAlgorithm = 'RM' | 'EDF' | 'Reinforcement Learning' | 'User-defined';

// Mapping from internal values to display names
const algorithmDisplayNames: Record<SchedulingAlgorithm, string> = {
  'RM': 'Rate Monotonic',
  'EDF': 'Earliest Deadline First',
  'Reinforcement Learning': 'Reinforcement Learning',
  'User-defined': 'User-defined'
};

const schedulingAlgorithms: SchedulingAlgorithm[] = ['RM', 'EDF', 'Reinforcement Learning', 'User-defined'];
const selectedAlgorithm = ref<SchedulingAlgorithm>('RM');
const rlBackendEnabled = ref(false); // Mock: backend not enabled by default
const showCodeEditor = ref(false);

// Monaco Editor
const editorContainer = ref<HTMLElement | null>(null);
let editor: monaco.editor.IStandaloneCodeEditor | null = null;
const customAlgorithmCode = ref(`# Instructions: implementing the following code
# This is a function inside the UserScheduler class

class UserScheduler:

    def priority_sort(self):

        # Attributes might be useful:
        # self.period -> ndarray storing the periods for all tasks
        # self.ddls -> ndarray storing the deadlines (for current job)
        # self.current_time -> current time stamp (int)
        
        # Examples
        self.prio = np.argsort(self.period) # RM
        # self.prio = np.argsort(self.ddls) # EDF
        # self.prio = np.argsort(self.ddls - self.current_time) # LSF
        # self.prio = np.argsort(self.ddls - self.current_time + self.period) # RM + LSF weighted
`);

// RL Access Modal
const showRLAccessModal = ref(false);
const rlAccessCode = ref('');
const rlAccessError = ref('');

// Valid access code (will be stored securely in backend later)
const VALID_RL_ACCESS_CODE = 'ZA616isrich';

// Handle RL access code submission
const submitRLAccessCode = () => {
  if (rlAccessCode.value === VALID_RL_ACCESS_CODE) {
    rlBackendEnabled.value = true;
    showRLAccessModal.value = false;
    rlAccessError.value = '';
    // Don't start simulation automatically, just enable the button
  } else {
    rlAccessError.value = 'Invalid access code. Please try again.';
  }
};

// Backend status
const backendStatus = ref<'ready' | 'error' | 'loading'>('loading')
const statusCheckInterval = ref<number | null>(null)

// Check backend status
const checkBackendStatus = async () => {
  try {
    backendStatus.value = 'loading'
    simulationState.status = 'Checking backend status...'
    const response = await fetch(`${BACKEND_URL}/status`)
    if (response.ok) {
      backendStatus.value = 'ready'
      simulationState.status = 'Ready to run'
    } else {
      backendStatus.value = 'error'
      simulationState.status = 'Backend error: Server not responding'
    }
  } catch (error) {
    backendStatus.value = 'error'
    simulationState.status = 'Backend error: Connection failed'
  }
}

// Simulation state
const simulationState = reactive<SimulationProgress & {
  isRunning: boolean
  isPaused: boolean
  simulationCompleted: boolean
}>({
  isRunning: false,
  isPaused: false,
  simulationCompleted: false,
  progress: 0,
  currentSlice: 0,
  totalSlices: 100,
  status: 'Ready to run',
  logs: []
})

// Results data - use props if provided, otherwise use internal state
const internalSimulationResults = reactive<SimulationResult>({
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

// Use computed to get the current simulation results (either from props or internal)
const simulationResults = computed(() => {
  return props.simulationResults || internalSimulationResults
})

// Timeline sliding window
const timelineWindow = ref({
  start: 0,
  size: 40 // Show 40 time slots at a time
})

// Simulation interval ID
let simulationInterval: number | null = null

// Clean up intervals on unmount
onBeforeUnmount(() => {
  if (simulationInterval) {
    clearInterval(simulationInterval)
  }
  if (statusCheckInterval.value) {
    clearInterval(statusCheckInterval.value)
    statusCheckInterval.value = null
  }
})

// Check backend status on mount
onMounted(() => {
  checkBackendStatus()
  // Check status every 5 seconds
  statusCheckInterval.value = window.setInterval(checkBackendStatus, 5000)
})

// Simulation controls
const startSimulation = async () => {
  if (!simulationState.isRunning && props.simulationConfig) {
    simulationState.isRunning = true
    simulationState.isPaused = false
    simulationState.simulationCompleted = false
    simulationState.progress = 0
    simulationState.currentSlice = 0
    simulationState.status = 'Initializing simulation...'
    simulationState.logs = []
    
    // Notify parent component that simulation is starting
    emit('update:isRunning', true)
    
    // Log the configuration being used
    simulationState.logs.push(`[System] Starting simulation with ${props.simulationConfig.hardware.processors.length} processor types`)
    simulationState.logs.push(`[System] Taskset: ${props.simulationConfig.taskset.taskCount} tasks, ${props.simulationConfig.taskset.taskModel} model`)
    
    // Use the global statusCheckInterval ref variable
    
    // Prepare API request data
    const apiRequestData = {
      seed: props.simulationConfig.taskset.randomSeed,
      numTask: props.simulationConfig.taskset.taskCount,
      uti: props.simulationConfig.taskset.utilization,
      cpuCount: props.simulationConfig.hardware.processors.find(p => p.type === 'CPU')?.count || 0,
      datacopy: props.simulationConfig.hardware.processors.find(p => p.type === 'DATACOPY')?.count || 0,
      gpuCount: props.simulationConfig.hardware.processors.find(p => p.type === 'GPU')?.count || 0,
      fpgaCount: props.simulationConfig.hardware.processors.find(p => p.type === 'FPGA')?.count || 0,
      numNode: props.simulationConfig.taskset.segmentNumber,
      edgeP: props.simulationConfig.taskset.edgeDensity,
      timeBound: props.simulationConfig.taskset.releaseTimes,
      taskpattern: props.simulationConfig.taskset.taskModel,
      workloadReduction: false, // Default value from backend
      algorithm: selectedAlgorithm.value,
      customAlgorithmCode: selectedAlgorithm.value === 'User-defined' ? customAlgorithmCode.value : undefined,
      userTaskset: props.userTaskset && props.userTaskset.length > 0 ? props.userTaskset : undefined
    }
    
    simulationState.status = 'Sending simulation request to backend...'
    
    try {
      
      // Debug: Print simulation request data
      console.log("Sending simulation request with data:", JSON.stringify(apiRequestData, null, 2))
      const response = await fetch(`${BACKEND_URL}/run-simulation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiRequestData)
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to run simulation')
      }
      
      const initialResult = await response.json()
      
      if (!initialResult.success || !initialResult.task_id) {
        throw new Error('Failed to start simulation: ' + (initialResult.error || 'Unknown error'))
      }
      
      const taskId = initialResult.task_id
      simulationState.logs.push(`[System] Simulation started with simulation ID: ${taskId}`)
      simulationState.status = 'Simulation running in background...'
      
      // Function to check simulation status
      const checkSimulationStatus = async () => {
        try {
          const statusResponse = await fetch(`${BACKEND_URL}/simulation-status/${taskId}`)
          const statusData = await statusResponse.json()
          
          if (!statusData.success) {
            throw new Error(statusData.error || 'Failed to check simulation status')
          }
          
          // Update simulation state
          simulationState.status = `Simulation ${statusData.status}...`
          
          // Update progress if available
          if (statusData.progress !== undefined) {
            simulationState.progress = statusData.progress
            simulationState.currentSlice = Math.round((statusData.progress / 100) * simulationState.totalSlices)
          }
          
          // Handle different statuses
          if (statusData.status === 'completed') {
            // Clear interval
            if (statusCheckInterval.value) {
              clearInterval(statusCheckInterval.value)
              statusCheckInterval.value = null
            }
            
            // Update simulation state
            simulationState.isRunning = false
            simulationState.simulationCompleted = true
            simulationState.status = 'Simulation completed!'
            simulationState.progress = 100  // Explicitly set to 100% when completed
            
            // Notify parent component that simulation has completed
            emit('update:isRunning', false)
            simulationState.currentSlice = simulationState.totalSlices
            
            const result = statusData.result
            
            // Process logs from backend
            if (result.logs) {
              let logLines: string[] = []
              if (typeof result.logs === 'string') {
                // Split string logs by lines
                logLines = result.logs.split('\n').filter((line: string) => line.trim() !== '')
              } else if (Array.isArray(result.logs)) {
                // Use array logs directly
                logLines = result.logs.filter((line: string) => line.trim() !== '')
              }
              simulationState.logs.push(...logLines)
            }
            
            // Update results
            if (result.success && result.statistics && result.timeline) {
              // Create a new results object with updated data
              const updatedResults: SimulationResult = {
                hasDeadlineMiss: !result.schedulable,
                deadlineMisses: result.deadlineMisses || [],
                averageResponseTime: result.statistics.length > 0 
                  ? result.statistics.reduce((sum: number, stat: any) => sum + stat.mean, 0) / result.statistics.length
                  : 0,
                worstResponseTime: result.statistics.length > 0
                  ? Math.max(...result.statistics.map((stat: any) => stat.max))
                  : 0,
                utilization: result.utilization || {},
                taskResponseStats: result.statistics.map((stat: any) => ({
                  taskId: stat.taskId,
                  count: stat.count,
                  mean: stat.mean,
                  stdDev: stat.std_dev,
                  q1: stat.q1,
                  median: stat.q2,
                  q3: stat.q3,
                  min: stat.min,
                  max: stat.max,
                  range: stat.range
                })),
                processorTimeline: [],
                trace: result.trace || [],
                isSchedulable: result.schedulable !== false
              }
              
              // Only map processor timeline if the taskset is schedulable and timeline exists
              if (updatedResults.isSchedulable && result.timeline && result.timeline.length > 0 && props.simulationConfig?.hardware?.processors) {
                const totalProcessors = props.simulationConfig.hardware.processors.reduce((sum, p) => sum + p.count, 0)
                const timelineLength = result.timeline[0]?.length || 0
                
                for (let processorId = 0; processorId < totalProcessors; processorId++) {
                  const processorTimeline: any[] = []
                  for (let timeSlot = 0; timeSlot < timelineLength; timeSlot++) {
                    const [taskId, segId] = result.timeline[processorId]?.[timeSlot] || [-1, -1]
                    if (taskId !== -1 && segId !== -1) {
                      processorTimeline.push({
                        processorId: processorId,
                        timeSlot: timeSlot,
                        taskId: taskId,
                        segmentId: segId
                      })
                    } else {
                      processorTimeline.push(null)
                    }
                  }
                  updatedResults.processorTimeline.push(processorTimeline)
                }
              } else {
                // Initialize empty timeline for non-schedulable cases
                simulationState.logs.push('[Results] Taskset is not schedulable')
              }
              
              // Log the results
              simulationState.logs.push('[Results] Simulation completed successfully')
              
              // Emit the results to parent component
              emit('simulation:finished', updatedResults)
            } else {
              simulationState.logs.push('[Error] Simulation failed: ' + (result.error || 'Unknown error'))
            }
          } else if (statusData.status === 'failed') {
            // Clear interval
            if (statusCheckInterval.value) {
              clearInterval(statusCheckInterval.value)
              statusCheckInterval.value = null
            }
            
            // Update simulation state
            simulationState.isRunning = false
            simulationState.status = 'Simulation failed!'
            simulationState.progress = 0
            simulationState.currentSlice = 0
            
            // Notify parent component that simulation has stopped
            emit('update:isRunning', false)
            
            // Log the error
            simulationState.logs.push('[Error] Simulation failed: ' + (statusData.error || 'Unknown error'))
          }
        } catch (error) {
          console.error('Error checking simulation status:', error)
          simulationState.logs.push(`[Error] Failed to check simulation status: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
      
      // Check status immediately
      await checkSimulationStatus()
      
      // Then check every 2 seconds
      statusCheckInterval.value = setInterval(checkSimulationStatus, 2000) as unknown as number
      
    } catch (error) {
      simulationState.isRunning = false
      simulationState.status = 'Simulation error'
      simulationState.progress = 0
      simulationState.currentSlice = 0
      
      // Notify parent component that simulation has stopped
      emit('update:isRunning', false)
      simulationState.logs.push(`[Error] ${error instanceof Error ? error.message : 'Unknown error'}`)
      
      // Clear interval if set
      if (statusCheckInterval.value) {
        clearInterval(statusCheckInterval.value)
        statusCheckInterval.value = null
      }
    }
  }
  else if (!props.simulationConfig) {
    simulationState.logs.push('[Error] No simulation configuration provided')
    simulationState.status = 'Error: Missing configuration'
  }
}









// Handle algorithm selection change
const updateAlgorithmSelection = () => {
  simulationState.logs.push(`[System] Selected algorithm: ${selectedAlgorithm.value}`)
  // Reset code editor when changing algorithms
  if (showCodeEditor.value) {
    showCodeEditor.value = false
  }
}


// Toggle code editor
// Initialize Monaco Editor
const initializeEditor = () => {
  if (editorContainer.value) {
    // Dispose existing editor if any
    disposeEditor()
    
    // Create new editor
    editor = monaco.editor.create(editorContainer.value, {
      value: customAlgorithmCode.value,
      language: 'python',
      theme: 'vs',
      automaticLayout: true,
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      fontSize: 14,
      tabSize: 4,
      lineNumbers: 'on',
      readOnly: false
    })
  }
}

// Dispose editor
const disposeEditor = () => {
  if (editor) {
    editor.dispose()
    editor = null
  }
}

const toggleCodeEditor = () => {
  showCodeEditor.value = !showCodeEditor.value
  
  if (showCodeEditor.value) {
    // Wait for DOM to update
    setTimeout(() => {
      if (editorContainer.value) {
        initializeEditor()
      }
    }, 100)
  } else {
    disposeEditor()
  }
}

// Save custom algorithm
const saveCustomAlgorithm = async () => {
  // Save the code from editor
  if (editor) {
    customAlgorithmCode.value = editor.getValue()
  }
  
  try {
    simulationState.status = 'Saving custom algorithm...'
    
    // Send the custom algorithm code to the backend
    const response = await fetch(`${BACKEND_URL}/save-custom-algorithm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customAlgorithmCode: customAlgorithmCode.value
      })
    })
    
    const result = await response.json()
    
    if (result.success) {
      simulationState.logs.push('[System] Custom scheduling algorithm saved successfully')
      simulationState.status = 'Custom algorithm saved successfully'
    } else {
      throw new Error(result.error || 'Failed to save custom algorithm')
    }
  } catch (error) {
    simulationState.logs.push(`[Error] Failed to save custom algorithm: ${error instanceof Error ? error.message : 'Unknown error'}`)
    simulationState.status = 'Failed to save custom algorithm'
  } finally {
    showCodeEditor.value = false
  }
}



// Calculate max timeline page
const maxTimelinePage = computed(() => {
  if (simulationResults.value.processorTimeline.length > 0 && simulationResults.value.processorTimeline[0]) {
    const maxTimeSlots = simulationResults.value.processorTimeline[0].length
    return Math.max(0, Math.ceil(maxTimeSlots / timelineWindow.value.size) - 1)
  }
  return 0
})

// Jump to specific timeline page
const jumpToTimelinePage = () => {
  const pageNumber = parseInt(jumpToPage.value)
  if (!isNaN(pageNumber)) {
    const clampedPage = Math.max(0, Math.min(pageNumber, maxTimelinePage.value))
    timelineWindow.value.start = clampedPage * timelineWindow.value.size
    jumpToPage.value = clampedPage.toString()
  }
}

// Timeline window controls
const previousTimelineWindow = () => {
  if (timelineWindow.value.start > 0) {
    timelineWindow.value.start = Math.max(0, timelineWindow.value.start - timelineWindow.value.size)
    jumpToPage.value = Math.floor(timelineWindow.value.start / timelineWindow.value.size).toString()
  }
}

const nextTimelineWindow = () => {
  if (simulationResults.value.processorTimeline.length > 0 && simulationResults.value.processorTimeline[0]) {
    const maxTimeSlots = simulationResults.value.processorTimeline[0].length
    if (timelineWindow.value.start + timelineWindow.value.size < maxTimeSlots) {
      timelineWindow.value.start = timelineWindow.value.start + timelineWindow.value.size
      jumpToPage.value = Math.floor(timelineWindow.value.start / timelineWindow.value.size).toString()
    }
  }
}

// Jump to page input
const jumpToPage = ref('0')

// Hangzhou subway line color scheme (RGB values from the reference image)
const taskColors = [
  '#E54360', // Line 1: Red
  '#DE5307', // Line 2: Orange
  '#F1C914', // Line 3: Yellow
  '#85C159', // Line 4: Green
  '#00AFC7', // Line 5: Cyan
  '#0073CB', // Line 6: Blue
  '#6A1792', // Line 7: Purple
  '#BF1856', // Line 8: Magenta
  '#AF4F00', // Line 9: Dark Orange
  '#DAA900', // Line 10: Gold
  '#638C1C', // Line 11: Dark Green
  '#006981', // Line 12: Dark Cyan
  '#001EA3', // Line 13: Dark Blue
  '#5626A5', // Line 14: Dark Purple
  '#EB7190', // Line 15: Light Pink
  '#ECA759', // Line 16: Light Orange
  '#E7E5A1', // Line 17: Light Yellow
  '#A0E2BA', // Line 18: Light Green
  '#96DAEA', // Line 19: Light Cyan
  '#92C0E9', // Line 20: Light Blue
  '#BF98DE', // Line 21: Light Purple
  '#FF4713', // Line 22: Bright Red
  '#FFB71B', // Line 23: Bright Orange
  '#CDDB00'  // Line 24: Bright Yellow-Green
];

// Get unique task IDs from simulation results
const uniqueTasks = computed(() => {
  const taskIds = new Set<number>();
  if (simulationResults.value.processorTimeline.length > 0) {
    for (const processorTimeline of simulationResults.value.processorTimeline) {
      for (const event of processorTimeline) {
        if (event && event.taskId !== undefined) {
          taskIds.add(event.taskId);
        }
      }
    }
  }
  return Array.from(taskIds).sort((a, b) => a - b);
});

// Get color for a specific task
const getTaskColor = (taskId: number): string => {
  const index = taskId % taskColors.length;
  return taskColors[index] || '#E5E7EB'; // Fallback to gray if index is invalid
};

// Processor types mapping with fixed order: CPU → DATACOPY → GPU → FPGA
const processorTypes = computed(() => {
  const types: string[] = []
  if (props.simulationConfig?.hardware?.processors) {
    // Define the fixed priority order
    const priorityOrder = ['CPU', 'DATACOPY', 'GPU', 'FPGA']
    
    // Iterate through the priority order
    for (const type of priorityOrder) {
      // Find the processor in the config
      const processor = props.simulationConfig.hardware.processors.find(p => p.type === type)
      if (processor) {
        // Add the processor type to the array for each count
        for (let i = 0; i < processor.count; i++) {
          types.push(processor.type)
        }
      }
    }
  }
  return types
})

// Sorted utilization data by processor type order: CPU → DATACOPY → GPU → FPGA
const sortedUtilization = computed(() => {
  const utilization = simulationResults.value.utilization
  const orderedKeys = ['CPU', 'DATACOPY', 'GPU', 'FPGA']
  const sortedData: { type: string; value: number }[] = []
  
  // Add keys in the desired order
  for (const key of orderedKeys) {
    if (key in utilization) {
      sortedData.push({ type: key, value: utilization[key] as number })
    }
  }
  
  // Add any remaining keys (in case there are other processor types)
  for (const key in utilization) {
    if (!orderedKeys.includes(key)) {
      sortedData.push({ type: key, value: utilization[key] as number })
    }
  }
  
  return sortedData
})

// Download trace
const downloadTrace = () => {
  try {
    // Serialize the actual value of the computed property, not the computed property itself
    const data = JSON.stringify(simulationResults.value, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'simulation_trace.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    simulationState.logs.push('[System] Trace downloaded')
  } catch (error) {
    console.error('Error downloading trace:', error)
    simulationState.logs.push(`[Error] Failed to download trace: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Clear logs
const clearLogs = () => {
  simulationState.logs = []
  simulationState.logs.push('[System] Logs cleared')
}
</script>

<template>
  <div class="run-control-panel">
    <h3>Run Simulation</h3>
    
    <!-- Scheduling Algorithm Selection -->
    <div class="config-section">
      <h4>Scheduling Algorithm</h4>
      <div class="dropdown-container">
        <select 
          v-model="selectedAlgorithm" 
          class="algorithm-select"
          @change="updateAlgorithmSelection"
        >
          <option v-for="alg in schedulingAlgorithms" :key="alg" :value="alg">{{ algorithmDisplayNames[alg] }}</option>
        </select>
      </div>
      
      <!-- RL Option Details -->
      <div v-if="selectedAlgorithm === 'Reinforcement Learning'" class="algorithm-details">
        <p class="algorithm-description">
          Reinforcement Learning scheduler using trained model. (Internal testing phase)
        </p>
        <button 
          class="rl-button"
          @click="showRLAccessModal = true"
        >
          Contact us for RL Feature
        </button>
      </div>
      
      <!-- User-defined Option Details -->
      <div v-if="selectedAlgorithm === 'User-defined'" class="algorithm-details">
        <p class="algorithm-description">Write your custom scheduling algorithm:</p>
        <button class="edit-code-btn" @click="toggleCodeEditor">Edit Code</button>
        
        <!-- Modal Code Editor -->
        <div v-if="showCodeEditor" class="modal-overlay">
          <div class="modal-content">
            <div class="modal-header">
              <h3>Edit Custom Scheduling Algorithm</h3>
              <button class="close-btn" @click="toggleCodeEditor">×</button>
            </div>
            <div class="modal-body">
              <div ref="editorContainer" class="code-editor-container"></div>
            </div>
            <div class="modal-footer">
              <button class="save-code-btn" @click="saveCustomAlgorithm">Save Code</button>
              <button class="cancel-code-btn" @click="toggleCodeEditor">Cancel</button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- RL Access Code Modal -->
      <div v-if="showRLAccessModal" class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3>RL Feature Access</h3>
            <button class="close-btn" @click="showRLAccessModal = false">×</button>
          </div>
          <div class="modal-body">
            <p style="color: #000;">Enter your access code to use the Reinforcement Learning scheduler:</p>
            <div class="access-code-container">
              <input 
                type="password" 
                v-model="rlAccessCode" 
                class="access-code-input"
                placeholder="Enter access code"
                @keyup.enter="submitRLAccessCode"
              />
              <p v-if="rlAccessError" class="error-message" style="color: #B85450">{{ rlAccessError }}</p>
            </div>
          </div>
          <div class="modal-footer">
            <button class="save-code-btn" @click="submitRLAccessCode">Submit</button>
            <button class="cancel-code-btn" @click="showRLAccessModal = false">Cancel</button>
          </div>
        </div>
      </div>
    </div>
    

    
    <!-- Status and Logs container -->
    <div class="status-logs-container">
      <!-- Status display -->
      <div class="status-section">
        <h4>Simulation Status</h4>
        <div class="status-info">
          <div class="status-item">
            <span class="status-label">Status:</span>
            <span class="status-value">
              <span class="backend-status-indicator" :class="backendStatus"></span>
              {{ simulationState.status }}
            </span>
          </div>
          <div class="status-item">
            <span class="status-label">Progress:</span>
            <span class="status-value">{{ simulationState.progress }}%</span>
          </div>
        </div>
        
        <!-- Progress bar -->
        <div class="progress-bar-container">
          <div 
            class="progress-bar"
            :style="{ width: simulationState.progress + '%' }"
          ></div>
        </div>
      </div>
      
      <!-- Log output -->
      <div class="logs-section">
        <h4>Simulation Logs</h4>
        <div class="logs-container">
          <div v-for="(log, index) in simulationState.logs" :key="index" class="log-entry">
            {{ log }}
          </div>
          <div v-if="simulationState.logs.length === 0" class="no-logs">
            No logs yet. Start the simulation to see logs.
          </div>
        </div>
      </div>
    </div>
    
    <!-- Run control buttons -->
    <div class="run-buttons">
      <button 
        class="run-btn primary-btn"
        @click="startSimulation"
        :disabled="(simulationState.isRunning && !simulationState.isPaused) || (selectedAlgorithm === 'Reinforcement Learning' && !rlBackendEnabled)"
      >
        {{ simulationState.isPaused ? 'Resume' : 'Run Simulation' }}
      </button>
    
      <button 
        class="run-btn secondary-btn"
        @click="clearLogs"
      >
        Clear Logs
      </button>
    </div>
    
    <!-- Results summary (only when simulation completes) -->
    <div v-if="simulationState.simulationCompleted" class="results-section">
      <div class="results-header">
        <h4>Simulation Results</h4>
        <span class="deadline-status" :class="{ 'deadline-meet': !simulationResults.hasDeadlineMiss, 'deadline-miss': simulationResults.hasDeadlineMiss }">
          {{ simulationResults.hasDeadlineMiss ? 'Deadline Miss' : 'Deadline Meet' }}
        </span>
      </div>
      

      
      <!-- Task Response Time Statistics -->
      <div v-if="simulationResults.taskResponseStats.length > 0" class="task-stats-section">
        <h5>Task Response Time Statistics</h5>
        <div class="task-stats-grid">
          <div v-for="stats in simulationResults.taskResponseStats" :key="stats.taskId" class="task-stat-card">
            <div class="task-stat-header">
              <h6>Task {{ stats.taskId }}</h6>
            </div>
            <div class="task-stat-content">
              <div class="task-stat-item">
                <span class="stat-label">Count:</span>
                <span class="stat-value">{{ stats.count }}</span>
              </div>
              <div class="task-stat-item">
                <span class="stat-label">Mean:</span>
                <span class="stat-value">{{ stats.mean.toFixed(2) }}</span>
              </div>
              <div class="task-stat-item">
                <span class="stat-label">Std Dev:</span>
                <span class="stat-value">{{ stats.stdDev.toFixed(2) }}</span>
              </div>
              <div class="task-stat-item">
                <span class="stat-label">Min:</span>
                <span class="stat-value">{{ stats.min.toFixed(2) }}</span>
              </div>
              <div class="task-stat-item">
                <span class="stat-label">Max:</span>
                <span class="stat-value">{{ stats.max.toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Processor Timeline -->
      <div v-if="simulationResults.processorTimeline.length > 0" class="timeline-section">
        <h4>Processor Timeline</h4>
        <!-- Task color legend -->
        <div v-if="uniqueTasks.length > 0" class="timeline-legend">
          <div 
            v-for="taskId in uniqueTasks" 
            :key="taskId" 
            class="legend-item"
          >
            <div 
              class="legend-color"
              :style="{ backgroundColor: getTaskColor(taskId) }"
            ></div>
            <span class="legend-label">Task {{ taskId }}</span>
          </div>
        </div>
        <div class="timeline-container">
          <div v-for="(timeline, processorId) in simulationResults.processorTimeline" :key="processorId" class="processor-timeline">
            <div class="processor-header">
              <span 
                class="processor-type" 
                :data-type="processorTypes[processorId] || 'Unknown'"
              >
                {{ processorTypes[processorId] || 'Unknown' }}
              </span>
              Processor {{ processorId }}
            </div>
            <div class="timeline-grid">
              <div 
                v-for="(event, t) in timeline.slice(timelineWindow.start, timelineWindow.start + timelineWindow.size)" 
                :key="t + timelineWindow.start" 
                class="time-slot"
                :class="{ 'has-task': event }"
                :style="{ 
                  backgroundColor: event ? getTaskColor(event.taskId) : 'transparent',
                  borderColor: event ? getTaskColor(event.taskId) : 'rgba(156, 163, 175, 0.3)'
                }"
              >
                <span v-if="event" class="task-label">
                  {{ event.segmentId }}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div class="timeline-controls">
          <button class="timeline-btn" @click="previousTimelineWindow" :disabled="timelineWindow.start === 0">Previous</button>
          <span class="timeline-range">
            Time slots {{ timelineWindow.start }}-{{ Math.min(timelineWindow.start + timelineWindow.size - 1, 
              simulationResults.processorTimeline.length > 0 && simulationResults.processorTimeline[0] ? simulationResults.processorTimeline[0].length - 1 : 0) }}
          </span>
          <button class="timeline-btn" @click="nextTimelineWindow" 
            :disabled="simulationResults.processorTimeline.length === 0 || 
              !simulationResults.processorTimeline[0] || 
              timelineWindow.start + timelineWindow.size >= simulationResults.processorTimeline[0].length">
            Next
          </button>
          <div class="timeline-jump">
            <span>Jump to page:</span>
            <input 
              type="number" 
              v-model="jumpToPage" 
              min="0" 
              :max="maxTimelinePage"
              @change="jumpToTimelinePage"
              @keyup.enter="jumpToTimelinePage"
              class="jump-input"
            >
            <span>of {{ maxTimelinePage }}</span>
          </div>
        </div>
      </div>
      
      <!-- Utilization -->
      <div class="utilization-section">
        <h4>Resource Utilization</h4>
        <table class="utilization-table">
          <thead>
            <tr>
              <th>Processor Type</th>
              <th>Utilization</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in sortedUtilization" :key="item.type">
              <td class="utilization-type">{{ item.type }}</td>
              <td>
                <div class="utilization-bar-container">
                  <div 
                    class="utilization-bar"
                    :style="{ width: (item.value * 100) + '%' }"
                    :class="{
                      'utilization-high': item.value > 0.8,
                      'utilization-medium': item.value > 0.5 && item.value <= 0.8,
                      'utilization-low': item.value <= 0.5
                    }"
                  ></div>
                </div>
              </td>
              <td class="utilization-percentage">{{ (item.value * 100).toFixed(1) }}%</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Download button -->
      <div class="download-section">
        <button class="download-btn" @click="downloadTrace">
          Download Trace JSON
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.run-control-panel {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.config-section {
  background-color: rgba(255, 255, 255, 0.6);
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  backdrop-filter: blur(10px);
}

.config-section h4 {
  margin-bottom: 1rem;
  color: var(--text-primary);
  font-size: 1.1rem;
}

.dropdown-container {
  margin-bottom: 1rem;
}

.algorithm-select {
  width: 100%;
  padding: 0.75rem;
  background-color: rgba(255, 255, 255, 0.8);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 1rem;
  transition: var(--transition);
}

.algorithm-select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px var(--primary-glow);
}

.algorithm-details {
  margin-top: 1rem;
}

.algorithm-description {
  margin-bottom: 1rem;
  color: var(--text-secondary);
  font-size: 0.95rem;
}

.algorithm-description.disabled {
  opacity: 0.6;
}

.rl-button {
  padding: 0.75rem 1rem;
  background-color: rgba(59, 130, 246, 0.8);
  color: white;
  border: 1px solid rgba(59, 130, 246, 0.5);
  border-radius: 6px;
  cursor: pointer;
  transition: var(--transition);
  font-weight: 500;
  width: 100%;
}

.rl-button:hover:not(.disabled) {
  background-color: rgba(37, 99, 235, 1);
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.4);
}

.rl-button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: rgba(59, 130, 246, 0.5);
}

.edit-code-btn, .save-code-btn, .cancel-code-btn {
  padding: 0.5rem 1rem;
  background-color: rgba(59, 130, 246, 0.8);
  color: white;
  border: 1px solid rgba(59, 130, 246, 0.5);
  border-radius: 4px;
  cursor: pointer;
  transition: var(--transition);
  font-weight: 500;
}

.edit-code-btn:hover, .save-code-btn:hover, .cancel-code-btn:hover {
  background-color: rgba(37, 99, 235, 1);
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.4);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  width: 200vw;
  max-width: 5000px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
  background-color: rgba(59, 130, 246, 0.1);
}

.modal-header h3 {
  margin: 0;
  color: var(--text-primary);
  font-size: 1.25rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: var(--transition);
}

.close-btn:hover {
  background-color: rgba(220, 38, 38, 0.1);
  color: var(--text-primary);
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border-color);
  background-color: rgba(249, 250, 251, 0.8);
}

.code-editor {
  width: 100%;
  height: 400px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 1rem;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.95rem;
  resize: vertical;
  background-color: #f8f9fa;
  color: #374151;
  line-height: 1.5;
  tab-size: 4;
  white-space: pre;
  overflow-wrap: normal;
  overflow-x: auto;
}

.code-editor:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px var(--primary-glow);
}

.code-editor-container {
  width: 100%;
  height: 500px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  overflow: hidden;
}

.code-editor:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px var(--primary-glow);
}

.editor-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
  justify-content: flex-end;
}

.save-code-btn {
  background-color: rgba(22, 163, 74, 0.8);
  border-color: rgba(22, 163, 74, 0.5);
}

.save-code-btn:hover {
  background-color: rgba(21, 128, 61, 1);
  box-shadow: 0 0 10px rgba(22, 163, 74, 0.4);
}

.cancel-code-btn {
  background-color: rgba(209, 213, 219, 0.8);
  color: #374151;
  border-color: rgba(156, 163, 175, 0.6);
}

.cancel-code-btn:hover {
  background-color: rgba(156, 163, 175, 1);
  box-shadow: 0 0 10px rgba(209, 213, 219, 0.6);
}

.action-buttons, .status-logs-container {
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
}

.status-section {
  width: 33.33%;
}

.logs-section {
  width: 66.67%;
}

.run-buttons {
  display: flex;
  flex-direction: row;
  gap: 0.75rem;
  justify-content: center;
}

.action-btn, .run-btn, .download-btn {
  padding: 0.75rem 1rem;
  border: 1px solid rgba(59, 130, 246, 0.5);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.action-btn {
  background-color: rgba(59, 130, 246, 0.8);
  color: white;
}

.action-btn:hover {
  background-color: rgba(37, 99, 235, 1);
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.4);
}

.run-btn {
  font-size: 1rem;
}

.primary-btn {
  background-color: rgba(22, 163, 74, 0.8);
  color: white;
  border-color: rgba(22, 163, 74, 0.6);
}

.primary-btn:hover {
  background-color: rgba(21, 128, 61, 1);
  box-shadow: 0 0 10px rgba(22, 163, 74, 0.4);
}

.secondary-btn {
  background-color: rgba(209, 213, 219, 0.8);
  color: #374151;
  border-color: rgba(156, 163, 175, 0.6);
}

.secondary-btn:hover {
  background-color: rgba(156, 163, 175, 1);
  box-shadow: 0 0 10px rgba(209, 213, 219, 0.6);
}

.danger-btn {
  background-color: rgba(220, 38, 38, 0.8);
  color: white;
  border-color: rgba(220, 38, 38, 0.6);
}

.danger-btn:hover {
  background-color: rgba(185, 28, 28, 1);
  box-shadow: 0 0 10px rgba(220, 38, 38, 0.4);
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

.status-section, .logs-section, .results-section {
  background-color: rgba(243, 244, 246, 0.8);
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid rgba(156, 163, 175, 0.3);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.status-section h4, .logs-section h4, .results-section h4 {
  margin-bottom: 1rem;
  color: #111827;
  font-size: 1.1rem;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.results-header h4 {
  margin: 0;
}

.deadline-status {
  font-weight: bold;
  padding: 0.5rem 1rem;
  border-radius: 4px;
}

.deadline-meet {
  color: green;
  background-color: rgba(0, 255, 0, 0.1);
  border: 1px solid rgba(0, 255, 0, 0.3);
}

.deadline-miss {
  color: red;
  background-color: rgba(255, 0, 0, 0.1);
  border: 1px solid rgba(255, 0, 0, 0.3);
}

.status-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.status-item {
  display: flex;
  justify-content: space-between;
}

.status-label {
  color: #4b5563;
  font-weight: 500;
}

.status-value {
  color: #111827;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.backend-status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}

.backend-status-indicator.ready {
  background-color: #22c55e;
  box-shadow: 0 0 10px rgba(34, 197, 94, 0.6);
}

.backend-status-indicator.error {
  background-color: #dc2626;
  box-shadow: 0 0 10px rgba(220, 38, 38, 0.6);
}

.backend-status-indicator.loading {
  background-color: #eab308;
  box-shadow: 0 0 10px rgba(234, 179, 8, 0.6);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.1);
  }
}

.progress-bar-container {
  width: 100%;
  height: 10px;
  background-color: rgba(156, 163, 175, 0.3);
  border-radius: 5px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background-color: #3b82f6;
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.4);
  transition: width 0.3s ease;
}

.logs-container {
  max-height: 200px;
  overflow-y: auto;
  background-color: white;
  padding: 1rem;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  border: 1px solid rgba(156, 163, 175, 0.2);
}

.log-entry {
  margin-bottom: 0.5rem;
  color: #374151;
}

.no-logs {
  color: #9ca3af;
  font-style: italic;
}

.result-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.result-label {
  color: #4b5563;
  font-weight: 500;
}

.result-value {
  color: #111827;
  font-weight: 600;
}

.result-value.has-miss {
  color: #dc2626;
}

.utilization-section {
  margin-top: 1.5rem;
}

.utilization-section h5 {
  margin-bottom: 1rem;
  color: #374151;
  font-size: 1rem;
}

.utilization-table {
  width: 100%;
  border-collapse: collapse;
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.utilization-table th,
.utilization-table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid rgba(156, 163, 175, 0.2);
}

.utilization-table th {
  background-color: rgba(243, 244, 246, 0.8);
  color: #374151;
  font-weight: 600;
}

.utilization-table tbody tr:last-child td {
  border-bottom: none;
}

.utilization-table tbody tr:hover {
  background-color: rgba(243, 244, 246, 0.5);
}

.utilization-type {
  color: #111827;
  font-weight: 500;
  width: 150px;
}

.utilization-bar-container {
  width: 100%;
  height: 12px;
  background-color: rgba(156, 163, 175, 0.3);
  border-radius: 6px;
  overflow: hidden;
}

.utilization-bar {
  height: 100%;
  transition: width 0.3s ease;
}

.utilization-bar.utilization-high {
  background-color: #dc2626;
  box-shadow: 0 0 8px rgba(220, 38, 38, 0.4);
}

.utilization-bar.utilization-medium {
  background-color: #f59e0b;
  box-shadow: 0 0 8px rgba(245, 158, 11, 0.4);
}

.utilization-bar.utilization-low {
  background-color: #22c55e;
  box-shadow: 0 0 8px rgba(34, 197, 94, 0.4);
}

.utilization-percentage {
  color: #111827;
  font-weight: 600;
  width: 60px;
  text-align: right;
}

.download-section {
  margin-top: 1.5rem;
}

.download-btn {
  background-color: rgba(59, 130, 246, 0.8);
  color: white;
  border-color: rgba(59, 130, 246, 0.6);
  width: 100%;
}

.download-btn:hover {
  background-color: rgba(37, 99, 235, 1);
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.4);
}

.timeline-controls {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
}

.timeline-jump {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  color: var(--text-primary);
}

.jump-input {
  width: 60px;
  padding: 0.5rem;
  border: 1px solid rgba(156, 163, 175, 0.6);
  border-radius: 4px;
  font-size: 0.9rem;
  text-align: center;
}

.jump-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px var(--primary-glow);
}

.timeline-range {
  color: #4b5563;
  font-weight: 500;
  min-width: 150px;
  text-align: center;
  font-size: 0.95rem;
}

.timeline-btn {
  padding: 0.5rem 1rem;
  background-color: rgba(59, 130, 246, 0.8);
  color: white;
  border: 1px solid rgba(59, 130, 246, 0.5);
  border-radius: 4px;
  cursor: pointer;
  transition: var(--transition);
  font-weight: 500;
}

.timeline-btn:hover:not(:disabled) {
  background-color: rgba(37, 99, 235, 1);
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.4);
}

.timeline-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Task Response Time Statistics Styles */
.task-stats-section {
  margin-top: 1.5rem;
  margin-bottom: 1.5rem;
}

.task-stats-section h5 {
  margin-bottom: 1rem;
  color: #374151;
  font-size: 1rem;
}

.task-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
  max-height: 400px;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.task-stat-card {
  background-color: white;
  border: 1px solid rgba(156, 163, 175, 0.3);
  border-radius: 6px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.task-stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.task-stat-header {
  margin-bottom: 0.75rem;
  border-bottom: 1px solid rgba(156, 163, 175, 0.2);
  padding-bottom: 0.5rem;
}

.task-stat-header h6 {
  margin: 0;
  color: #111827;
  font-size: 1rem;
  font-weight: 600;
}

.task-stat-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.task-stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  color: #6b7280;
  font-size: 0.9rem;
  font-weight: 500;
}

.stat-value {
  color: #111827;
  font-size: 0.95rem;
  font-weight: 600;
}

/* Scrollbar styling for task stats grid */
.task-stats-grid::-webkit-scrollbar {
  width: 6px;
}

.task-stats-grid::-webkit-scrollbar-track {
  background: rgba(229, 231, 235, 0.8);
  border-radius: 3px;
}

.task-stats-grid::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.6);
  border-radius: 3px;
}

.task-stats-grid::-webkit-scrollbar-thumb:hover {
  background: rgba(107, 114, 128, 0.8);
}

/* Processor Timeline Styles */
.timeline-container {
  background-color: white;
  border: 1px solid rgba(156, 163, 175, 0.3);
  border-radius: 6px;
  padding: 1rem;
  overflow-x: auto;
  margin-top: 1rem;
}

.processor-timeline {
  margin-bottom: 1rem;
}

.processor-header {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #374151;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.processor-type {
  font-size: 0.85rem;
  font-weight: 500;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  background-color: rgba(156, 163, 175, 0.3);
  color: #374151;
}

.processor-type[data-type="CPU"] {
  background-color: rgba(59, 130, 246, 0.2);
  color: #2563eb;
}

.processor-type[data-type="GPU"] {
  background-color: rgba(168, 85, 247, 0.2);
  color: #a855f7;
}

.processor-type[data-type="DATACOPY"] {
  background-color: rgba(22, 163, 74, 0.2);
  color: #16a34a;
}

.timeline-grid {
  display: flex;
  gap: 1px;
  background-color: rgba(156, 163, 175, 0.2);
  padding: 2px;
  border-radius: 4px;
  overflow-x: auto;
}

.time-slot {
  width: 35px;
  height: 20px;
  background-color: rgba(243, 244, 246, 1);
  border: 1px solid rgba(156, 163, 175, 0.3);
  border-radius: 2px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 0.7rem;
  overflow: hidden;
}

.time-slot.has-task {
  color: white;
}

.task-label {
  font-weight: 500;
  font-size: 0.7rem;
}

/* Timeline Legend Styles */
.timeline-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin: 1rem 0;
  padding: 0.75rem;
  background-color: rgba(255, 255, 255, 0.5);
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
}

.legend-color {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 4px;
  border: 1px solid var(--border-color);
}

.legend-label {
  font-weight: 500;
  color: var(--text-primary);
}
</style>