<script setup lang="ts">
import { reactive, watch, computed, ref } from 'vue'
import type { TasksetConfig, TaskModel, HardwareConfig, TaskNode, TaskEdge } from '../types/api'

const props = defineProps<{
  modelValue?: TasksetConfig
  hardwareConfig?: HardwareConfig
}>()

const emit = defineEmits<{
  'update:modelValue': [config: TasksetConfig]
  'update:uploadedTasks': [tasks: any[]]
}>()

// Task model options
const taskModelOptions: TaskModel[] = ['DAG', 'Suspension'];

// Function to convert hardware config to mode string
const getModeString = (): string => {
  if (!props.hardwareConfig || props.hardwareConfig.processors.length === 0) {
    return "CPU GPU ";
  }
  
  const modeParts: string[] = [];
  props.hardwareConfig.processors.forEach(processor => {
    if (processor.count > 0) {
      modeParts.push(processor.type);
    }
  });
  
  // If no processors with count > 0, return default
  if (modeParts.length === 0) {
    return "CPU GPU ";
  }

  return modeParts.join(" ") + " " + tasksetConfig.taskModel + " ";
};

// Taskset configuration
const tasksetConfig = reactive<TasksetConfig>({
  taskCount: props.modelValue?.taskCount || 5,
  taskModel: props.modelValue?.taskModel || 'DAG',
  edgeDensity: props.modelValue?.edgeDensity || 0.2,
  utilization: props.modelValue?.utilization || 1.0,
  segmentNumber: props.modelValue?.segmentNumber || 10,
  releaseTimes: props.modelValue?.releaseTimes || 20000,
  genMethod: 'User',
  randomSeed: props.modelValue?.randomSeed || 12
})

// Segment length range (frontend only)
const segmentLengthRange = reactive({
  min: 1,
  max: 10
})


// Calculate total processor count
const totalProcessorCount = computed(() => {
  if (!props.hardwareConfig || !props.hardwareConfig.processors) {
    return 0
  }
  return props.hardwareConfig.processors.reduce((total, processor) => total + processor.count, 0)
})

// Check if utilization exceeds processor count
const utilizationExceedsProcessors = computed(() => {
  return tasksetConfig.utilization > totalProcessorCount.value
})

// Handle utilization change
const updateUtilization = (event: Event) => {
  const value = parseFloat((event.target as HTMLInputElement).value)
  if (!isNaN(value) && value >= 0.1 && value <= 10.0) {
    tasksetConfig.utilization = value
  }
}

// Watch for changes and emit updates
watch(tasksetConfig, (newConfig) => {
  emit('update:modelValue', { ...newConfig })
}, { deep: true })



// Handle task count change
const updateTaskCount = (event: Event) => {
  const value = parseInt((event.target as HTMLInputElement).value)
  if (!isNaN(value) && value >= 5 && value <= 20) {
    tasksetConfig.taskCount = value
  }
}

// Handle task model change
const updateTaskModel = (event: Event) => {
  tasksetConfig.taskModel = (event.target as HTMLInputElement).value as TaskModel
}

// Handle edge density change
const updateEdgeDensity = (event: Event) => {
  const value = parseFloat((event.target as HTMLInputElement).value)
  if (!isNaN(value) && value >= 0.01 && value <= 0.5) {
    tasksetConfig.edgeDensity = value
  }
}

// Handle segment number change
const updateSegmentNumber = (event: Event) => {
  const value = parseInt((event.target as HTMLInputElement).value)
  if (!isNaN(value) && value >= 3 && value <= 30) {
    tasksetConfig.segmentNumber = value
  }
}


// Handle gen method change
const updateGenMethod = (event: Event) => {
  const value = (event.target as HTMLInputElement).value
  tasksetConfig.genMethod = value as 'User' | 'Random'
}

// Handle random seed change
const updateRandomSeed = (event: Event) => {
  const value = parseInt((event.target as HTMLInputElement).value)
  if (!isNaN(value) && value >= 1 && value <= 100000) {
    tasksetConfig.randomSeed = value
  }
}

// Task graph modal
const showTaskGraphModal = ref(false)

// Define DAG type
interface TaskDAG {
  nodes: TaskNode[]
  edges: TaskEdge[]
  taskId: number
  period: number
  segmentNumber: number
  edgeNumber: number
}

// Generated tasks data
const generatedTasks = reactive({
  nodes: [] as TaskNode[],
  edges: [] as TaskEdge[]
})

// Multiple DAGs storage
const dagList = ref<TaskDAG[]>([])

// Pagination state
const currentPage = ref(1)
const totalPages = computed(() => dagList.value.length)

// Upload status
const uploadStatus = reactive({
  success: false,
  message: ''
})

// Error status for DAG generation
const generationError = reactive({
  hasError: false,
  message: ''
})

// Uploaded tasks data
const uploadedTasks = ref<any[]>([])

// Watch for uploaded tasks changes
watch(uploadedTasks, (newTasks) => {
  emit('update:uploadedTasks', newTasks)
}, { deep: true })

// Handle file upload
const handleFileUpload = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return
  
  const file = input.files[0]
  const reader = new FileReader()
  
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string
      const tasks = JSON.parse(content)
      
      if (!Array.isArray(tasks)) {
        throw new Error('Invalid format: Expected an array of tasks')
      }
      
      // Validate each task
      for (const task of tasks) {
        if (!task.period || !Array.isArray(task.nodes)) {
          throw new Error('Invalid task format: Each task must have period and nodes')
        }
      }
      
      uploadedTasks.value = tasks
      
      // Calculate taskCount
      tasksetConfig.taskCount = tasks.length
      
      // Calculate segmentNumber (max num_node)
      tasksetConfig.segmentNumber = Math.max(...tasks.map(task => task.nodes.length), 1)
      
      // Calculate utilization
      let totalUtilization = 0
      for (const task of tasks) {
        const taskUtilization = task.nodes.reduce((sum: number, node: any) => sum + (node.segment || node.s || 0), 0) / task.period
        totalUtilization += taskUtilization
      }
      tasksetConfig.utilization = Math.round(totalUtilization * 10) / 10
      
      // Set taskModel to DAG
      tasksetConfig.taskModel = 'DAG'
      
      uploadStatus.success = true
      uploadStatus.message = `Successfully uploaded ${tasks.length} tasks`
      
    } catch (error) {
      uploadStatus.success = false
      uploadStatus.message = `Error parsing file: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
  
  reader.onerror = () => {
    uploadStatus.success = false
    uploadStatus.message = 'Error reading file'
  }
  
  if (file) {
    reader.readAsText(file)
  }
}

// Load default example
const loadDefaultExample = async () => {
  try {
    const response = await fetch('/src/examples/task_config_example.json')
    const defaultExample = await response.json()
    
    // Load the example into uploaded tasks
    uploadedTasks.value = defaultExample
    
    // Calculate taskCount
    tasksetConfig.taskCount = defaultExample.length
    
    // Calculate segmentNumber (max num_node)
    tasksetConfig.segmentNumber = Math.max(...defaultExample.map((task: any) => task.nodes.length), 1)
    
    // Calculate utilization
    let totalUtilization = 0
    for (const task of defaultExample) {
      const taskUtilization = task.nodes.reduce((sum: number, node: any) => sum + (node.segment || 0), 0) / task.period
      totalUtilization += taskUtilization
    }
    tasksetConfig.utilization = Math.round(totalUtilization * 10) / 10
    
    // Set taskModel to DAG
    tasksetConfig.taskModel = 'DAG'
    
    uploadStatus.success = true
    uploadStatus.message = 'Default example loaded successfully.'
  } catch (error) {
    uploadStatus.success = false
    uploadStatus.message = `Error loading example: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}

// Load Vit + LM example
const loadVitLmExample = async () => {
  try {
    const response = await fetch('/src/examples/vit_llama_example.json')
    const vitLmExample = await response.json()
    
    // Load the example into uploaded tasks
    uploadedTasks.value = vitLmExample
    
    // Calculate taskCount
    tasksetConfig.taskCount = vitLmExample.length
    
    // Calculate segmentNumber (max num_node)
    tasksetConfig.segmentNumber = Math.max(...vitLmExample.map((task: any) => task.nodes.length), 1)
    
    // Calculate utilization
    let totalUtilization = 0
    for (const task of vitLmExample) {
      const taskUtilization = task.nodes.reduce((sum: number, node: any) => sum + (node.segment || 0), 0) / task.period
      totalUtilization += taskUtilization
    }
    tasksetConfig.utilization = Math.round(totalUtilization * 10) / 10
    
    // Set taskModel to DAG
    tasksetConfig.taskModel = 'DAG'
    
    uploadStatus.success = true
    uploadStatus.message = 'Vit + LM example loaded successfully.'
  } catch (error) {
    uploadStatus.success = false
    uploadStatus.message = `Error loading Vit + LM example: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}

// Load MLP example
const loadMlpExample = async () => {
  try {
    const response = await fetch('/src/examples/mnist_mlp_example.json')
    const mlpExample = await response.json()
    
    // Load the example into uploaded tasks
    uploadedTasks.value = mlpExample
    
    // Calculate taskCount
    tasksetConfig.taskCount = mlpExample.length
    
    // Calculate segmentNumber (max num_node)
    tasksetConfig.segmentNumber = Math.max(...mlpExample.map((task: any) => task.nodes.length), 1)
    
    // Calculate utilization
    let totalUtilization = 0
    for (const task of mlpExample) {
      const taskUtilization = task.nodes.reduce((sum: number, node: any) => sum + (node.segment || 0), 0) / task.period
      totalUtilization += taskUtilization
    }
    tasksetConfig.utilization = Math.round(totalUtilization * 10) / 10
    
    // Set taskModel to DAG
    tasksetConfig.taskModel = 'DAG'
    
    uploadStatus.success = true
    uploadStatus.message = 'MLP example loaded successfully.'
  } catch (error) {
    uploadStatus.success = false
    uploadStatus.message = `Error loading MLP example: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}

// Show default example
const showDefaultExample = () => {
  // Create a temporary JSON file and download it
  // Instead of hardcoding, we'll download the same file we use for loading
  const a = document.createElement('a')
  a.href = '/src/examples/task_config_example.json'
  a.download = 'task_config_example.json'
  a.click()
  
  uploadStatus.success = true
  uploadStatus.message = 'Example downloaded. Please upload this file.'
}

// Computed property for displaying task configuration without edgeDensity and randomSeed
const displayTasksetConfig = computed(() => {
  if (tasksetConfig.genMethod === 'User') {
    const { edgeDensity, randomSeed, ...configWithoutExcluded } = tasksetConfig
    return configWithoutExcluded
  } else {
    const { edgeDensity, randomSeed, ...configWithoutExcluded } = tasksetConfig
    return configWithoutExcluded
  }
})

// Drag and drop state
const draggedNode = ref<string | null>(null)
const dragOffset = ref({ x: 0, y: 0 })

// Debug section expanded state
const debugSectionExpanded = ref(false)

// Close task graph modal
const closeTaskGraphModal = () => {
  showTaskGraphModal.value = false
  draggedNode.value = null
}

// Get node position for edges
const getNodePosition = (nodeId: string) => {
  const node = generatedTasks.nodes.find(n => n.id === nodeId)
  return node || { x: 0, y: 0 }
}

// Drag start handler
const handleDragStart = (event: MouseEvent, nodeId: string) => {
  event.preventDefault()
  draggedNode.value = nodeId
  const node = generatedTasks.nodes.find(n => n.id === nodeId)
  if (node) {
    const container = document.querySelector('.task-graph-container') as HTMLElement
    if (container) {
      const rect = container.getBoundingClientRect()
      dragOffset.value = {
        x: event.clientX - (rect.left + node.x),
        y: event.clientY - (rect.top + node.y)
      }
      // Add global event listeners for dragging
      document.addEventListener('mousemove', handleDragMove)
      document.addEventListener('mouseup', handleDragEnd)
    }
  }
}

// Drag move handler
const handleDragMove = (event: MouseEvent) => {
  if (!draggedNode.value) return
  
  const node = generatedTasks.nodes.find(n => n.id === draggedNode.value)
  if (node) {
    const container = document.querySelector('.task-graph-container') as HTMLElement
    if (container) {
      const rect = container.getBoundingClientRect()
      const newX = event.clientX - rect.left - dragOffset.value.x
      const newY = event.clientY - rect.top - dragOffset.value.y
      
      // Ensure nodes stay within container boundaries
      node.x = Math.max(0, Math.min(newX, rect.width - 80))
      node.y = Math.max(0, Math.min(newY, rect.height - 80))
    }
  }
}

// Drag end handler
const handleDragEnd = () => {
  // Remove global event listeners
  document.removeEventListener('mousemove', handleDragMove)
  document.removeEventListener('mouseup', handleDragEnd)
  draggedNode.value = null
  dragOffset.value = { x: 0, y: 0 }
}

// Calculate topological order for a DAG
const topologicalSort = (nodes: TaskNode[], edges: TaskEdge[]): string[] => {
  // Build adjacency list and in-degree map
  const adjacencyList = new Map<string, string[]>()
  const inDegree = new Map<string, number>()
  
  // Initialize maps
  nodes.forEach(node => {
    adjacencyList.set(node.id, [])
    inDegree.set(node.id, 0)
  })
  
  // Build adjacency list and calculate in-degrees
  edges.forEach(edge => {
    adjacencyList.get(edge.source)?.push(edge.target)
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1)
  })
  
  // Kahn's algorithm for topological sorting
  const queue: string[] = []
  inDegree.forEach((degree, nodeId) => {
    if (degree === 0) {
      queue.push(nodeId)
    }
  })
  
  const result: string[] = []
  while (queue.length > 0) {
    const nodeId = queue.shift()!
    result.push(nodeId)
    
    const neighbors = adjacencyList.get(nodeId) || []
    neighbors.forEach(neighborId => {
      inDegree.set(neighborId, (inDegree.get(neighborId) || 0) - 1)
      if (inDegree.get(neighborId) === 0) {
        queue.push(neighborId)
      }
    })
  }
  
  // If there's a cycle, return original order
  if (result.length !== nodes.length) {
    console.warn('Cycle detected in DAG, using original order')
    return nodes.map(node => node.id)
  }
  
  return result
}

// Adjust node coordinates using topological sorting
const adjustNodePositions = (dag: TaskDAG): void => {
  const { nodes, edges } = dag
  const topologicalOrder = topologicalSort(nodes, edges)
  
  // Create a map from node id to node
  const nodeMap = new Map<string, TaskNode>()
  nodes.forEach(node => nodeMap.set(node.id, node))
  
  // Group nodes by their topological level
  const levelMap = new Map<string, number>()
  let maxLevel = 0
  
  topologicalOrder.forEach(nodeId => {
    const incomingEdges = edges.filter(edge => edge.target === nodeId)
    
    if (incomingEdges.length === 0) {
      // Root node, level 0
      levelMap.set(nodeId, 0)
    } else {
      // Node with incoming edges, level is max level of parents + 1
      const parentLevels = incomingEdges.map(edge => levelMap.get(edge.source) || 0)
      const nodeLevel = Math.max(...parentLevels) + 1
      levelMap.set(nodeId, nodeLevel)
      maxLevel = Math.max(maxLevel, nodeLevel)
    }
  })
  
  // Group nodes by level
  const levelNodes = new Map<number, TaskNode[]>()
  levelMap.forEach((level, nodeId) => {
    const node = nodeMap.get(nodeId)!
    if (!levelNodes.has(level)) {
      levelNodes.set(level, [])
    }
    levelNodes.get(level)?.push(node)
  })
  
  // Calculate positions
  const nodeHeight = 80
  let horizontalSpacing = 150
  let verticalSpacing = 40
  
  // Adjust spacing based on number of levels and nodes per level
  const maxNodesPerLevel = Math.max(...Array.from(levelNodes.values()).map(nodes => nodes.length), 1)
  const totalLevels = maxLevel + 1
  
  // If too many levels, reduce horizontal spacing to fit
  if (totalLevels > 5) {
    horizontalSpacing = Math.max(-20, 850 / totalLevels) // Minimum 20px spacing
  }
  
  // If too many nodes per level, reduce vertical spacing to fit
  if (maxNodesPerLevel > 4) {
    verticalSpacing = Math.max(-20, 400 / maxNodesPerLevel - nodeHeight) // Minimum 5px spacing
  }
  
  levelNodes.forEach((nodesAtLevel, level) => {
    const x = level * horizontalSpacing
    const levelHeight = nodesAtLevel.length * (nodeHeight + verticalSpacing)
    const startY = Math.max(0, (600 - levelHeight) / 2) // Ensure startY is non-negative
    
    nodesAtLevel.forEach((node, index) => {
      node.x = x
      node.y = startY + index * (nodeHeight + verticalSpacing)
    })
  })
}

// Save a DAG to the list
const saveDAG = (nodes: TaskNode[], edges: TaskEdge[], taskId: number, period: number): TaskDAG => {
  const dag: TaskDAG = {
    nodes: [...nodes],
    edges: [...edges],
    taskId: taskId,
    period: period,
    segmentNumber: nodes.length,
    edgeNumber: edges.length
  }
  dagList.value.push(dag)
  return dag
}

// Generate random tasks
const generateRandomTasks = async () => {
  // Clear previous DAGs
  dagList.value = []
  currentPage.value = 1
  
  try {
    if (tasksetConfig.genMethod === 'User' && uploadedTasks.value.length > 0) {
      // Use uploaded tasks data
      console.log('Using uploaded tasks data:', uploadedTasks.value)
      
      let edgeIdCounter = 1
      
      // Process each uploaded task
      for (let taskIndex = 0; taskIndex < uploadedTasks.value.length; taskIndex++) {
        const task = uploadedTasks.value[taskIndex]
        const nodes: TaskNode[] = []
        const edges: TaskEdge[] = []
        
        if (!task.period || !Array.isArray(task.nodes)) {
          continue
        }
        
        const period = task.period
        const taskNodes = []
        
        // Create nodes for each segment
        for (let i = 0; i < task.nodes.length; i++) {
          const nodeData = task.nodes[i]
          if (!nodeData) continue
          
          const nodeTypeValue = 'type' in nodeData ? nodeData.type : nodeData.t
          const affinity = nodeTypeValue === 0 ? 'CPU' : nodeTypeValue === 7 ? 'GPU' : nodeTypeValue === 3 ? 'DATACOPY' : nodeTypeValue === 8 ? 'FPGA' : 'Any'
          const nodeType = affinity === 'CPU' || affinity === 'GPU' ? 'Compute' : 'Datacopy'
          
          const node: TaskNode = {
            id: `T${taskIndex}-${i}`,
            name: `Segment ${i}`,
            type: nodeType,
            executionTime: nodeData.segment || nodeData.s || 0,
            affinity: affinity,
            x: 0, // Will be adjusted by topological sorting
            y: 0, // Will be adjusted by topological sorting
            period: period,
            deadline: period
          }
          
          taskNodes.push(node)
          nodes.push(node)
        }
        
        // Create edges for dependencies
        if (Array.isArray(task.dependencies)) {
          for (const dep of task.dependencies) {
            if (!Array.isArray(dep) || dep.length < 2) continue
            
            const [u, v] = dep
            const sourceNode = taskNodes[u]
            const targetNode = taskNodes[v]
            
            if (sourceNode && targetNode) {
              const edge: TaskEdge = {
                id: `E${edgeIdCounter++}`,
                source: sourceNode.id,
                target: targetNode.id
              }
              edges.push(edge)
            }
          }
        }
        
        // Save the DAG
        const dag = saveDAG(nodes, edges, task.taskId || (taskIndex + 1), period)
        
        // Adjust node positions using topological sorting
        adjustNodePositions(dag)
      }
    } else {
      // Call Flask API to generate DAG tasks
      console.log('Sending API request with config:', {
        n: tasksetConfig.taskCount,
        uti: tasksetConfig.utilization,
        p: tasksetConfig.edgeDensity,
        node_max: tasksetConfig.segmentNumber,
        mode: getModeString()
      })
      
      const response = await fetch('/api/generate-dag-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          n: tasksetConfig.taskCount,
          uti: tasksetConfig.utilization,
          p: tasksetConfig.edgeDensity,
          node_max: tasksetConfig.segmentNumber,
          mode: getModeString(),
          seed: tasksetConfig.randomSeed
        })
      })
      
      console.log('API response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to generate DAG tasks: ${response.status} ${response.statusText} - ${errorText}`)
      }
      
      const data = await response.json()
      console.log('API response data:', data)
      
      const tasks = data.tasks
      if (!Array.isArray(tasks)) {
        throw new Error('Invalid response format: tasks is not an array')
      }
      
      // Convert backend data to frontend task graph
      let edgeIdCounter = 1

      // Process each generated task (each task is a DAG)
      for (let taskIndex = 0; taskIndex < tasks.length; taskIndex++) {
        const task = tasks[taskIndex]
        const nodes: TaskNode[] = []
        const edges: TaskEdge[] = []
        
        if (!Array.isArray(task)) {
          throw new Error('Invalid task format: task is not an array')
        }
        
        const [period, num_nodes, , ...rest] = task
        
        if (typeof period !== 'number' || typeof num_nodes !== 'number') {
          throw new Error('Invalid task structure: period or num_nodes is not a number')
        }
        
        // Extract segments and dependencies
        const segments: { s: number, t: number }[] = []
        const dependencies = []
        
        // First num_nodes elements are segments (s, t)
        console.log(`Extracting ${num_nodes} segments from rest:`, rest)
        for (let i = 0; i < num_nodes * 2; i += 2) {
          if (i + 1 >= rest.length) {
            throw new Error(`Insufficient segment data: expected ${num_nodes * 2} elements, got ${rest.length}`)
          }
          segments.push({ s: rest[i], t: rest[i + 1] })
        }
        
        // Remaining elements are dependencies (u, v)
        console.log(`Extracting dependencies from rest starting at index ${num_nodes * 2}`)
        for (let i = num_nodes * 2; i < rest.length; i += 2) {
          if (i + 1 >= rest.length) {
            throw new Error(`Insufficient dependency data: expected even number of elements, got ${rest.length - i}`)
          }
          dependencies.push({ u: rest[i], v: rest[i + 1] })
        }
        
        // Create nodes for each segment
        const taskNodes = []
        for (let i = 0; i < segments.length; i++) {
          const segment = segments[i]
          if (!segment) continue
          
          const affinity = segment.t === 0 ? 'CPU' : segment.t === 7 ? 'GPU' : segment.t === 3 ? 'DATACOPY' : segment.t === 8 ? 'FPGA' : 'Any'
          const nodeType = affinity === 'CPU' || affinity === 'GPU' ? 'Compute' : 'Datacopy'
          
          const node: TaskNode = {
            id: `T${taskIndex}-${i}`,
            name: `Segment ${i}`,
            type: nodeType,
            executionTime: segment.s,
            affinity: affinity,
            x: 0, // Will be adjusted by topological sorting
            y: 0, // Will be adjusted by topological sorting
            period: period,
            deadline: period
          }
          
          taskNodes.push(node)
          nodes.push(node)
        }
        
        // Create edges for dependencies
        const dependenciesTyped = dependencies as { u: number, v: number }[]
        for (const dep of dependenciesTyped) {
          if (!dep) continue
          
          const sourceNode = taskNodes[dep.u]
          const targetNode = taskNodes[dep.v]
          
          if (sourceNode && targetNode) {
            const edge: TaskEdge = {
              id: `E${edgeIdCounter++}`,
              source: sourceNode.id,
              target: targetNode.id
            }
            edges.push(edge)
          }
        }
        
        // Save the DAG
        const dag = saveDAG(nodes, edges, taskIndex + 1, period)
        
        // Adjust node positions using topological sorting
        adjustNodePositions(dag)
      }
    }
    
  } catch (error) {
    console.error('Error generating DAG tasks:', error)
    
    // Clear any previous DAGs
    dagList.value = []
    
    // Set error message
    generationError.hasError = true
    generationError.message = 'Generation Error! Please adjust the parameter and retry'
    
    // Common issues list
    const commonIssues = [
      'Large number of tasksets but low utilization',
      'Large number of segments but low edge density',
      'Large number of processor types but low segment number'
    ]
    
    // Join common issues for display
    const issuesText = commonIssues.map(issue => `- ${issue}`).join('\n')
    generationError.message += '\n\nCommon issues:\n' + issuesText
    
    // Reset generated tasks
    generatedTasks.nodes = []
    generatedTasks.edges = []
  }
  
  // Load the first DAG
  if (dagList.value.length > 0) {
    loadDAG(currentPage.value)
  }
}

// Load a specific DAG page
const loadDAG = (page: number) => {
  if (page < 1 || page > dagList.value.length) {
    return
  }
  
  currentPage.value = page
  const dag = dagList.value[page - 1]
  if (dag) {
    generatedTasks.nodes = dag.nodes
    generatedTasks.edges = dag.edges
  } else {
    generatedTasks.nodes = []
    generatedTasks.edges = []
  }
}

// Navigate to previous page
const prevPage = () => {
  if (currentPage.value > 1) {
    loadDAG(currentPage.value - 1)
  }
}

// Navigate to next page
const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    loadDAG(currentPage.value + 1)
  }
}

// Save generated task graph
const saveTaskGraph = () => {
  console.log('Task graph saved:', generatedTasks)
  closeTaskGraphModal()
}

// Watch for modal open and generate tasks
watch(showTaskGraphModal, async (newValue) => {
  if (newValue) {
    await generateRandomTasks()
    // generateRandomTasks internally calls loadDAG which updates generatedTasks
  }
})
</script>

<template>
  <div class="taskset-config-panel">
    <h3>Task Configuration</h3>
    
    <!-- Generation Method -->
    <div class="config-section">
      <h4>Generation Method</h4>
      <div class="radio-group">
        <label class="radio-label">
          <input 
            type="radio" 
            value="User" 
            v-model="tasksetConfig.genMethod"
            @change="updateGenMethod"
          />
          <span class="radio-text">User Upload</span>
        </label>
        <label class="radio-label">
          <input 
            type="radio" 
            value="Random" 
            v-model="tasksetConfig.genMethod"
            @change="updateGenMethod"
          />
          <span class="radio-text">Randomly Generate</span>
        </label>
      </div>
    </div>
    
    <!-- Taskset Metadata Section (for Random Generation) -->
    <div v-if="tasksetConfig.genMethod === 'Random'" class="config-section">
      <h4>Taskset Metadata</h4>
      <div class="grid-2x2">
        <!-- Task Count -->
        <div class="grid-item">
          <label class="setting-label">Task Count</label>
          <div class="slider-container">
            <input 
              type="range" 
              min="5" 
              max="20" 
              :value="tasksetConfig.taskCount"
              @input="updateTaskCount"
              class="task-slider"
            />
            <div class="slider-value">
              <input 
                type="number" 
                min="5" 
                max="20" 
                :value="tasksetConfig.taskCount"
                @input="updateTaskCount"
                class="number-input"
              />
            </div>
          </div>
        </div>
        
        <!-- Taskset Utilization -->
        <div class="grid-item">
          <label class="setting-label">Taskset Utilization</label>
          <div class="slider-container">
            <input 
              type="range" 
              min="0.1" 
              max="10.0" 
              step="0.1"
              :value="tasksetConfig.utilization"
              @input="updateUtilization"
              class="utilization-slider"
            />
            <div class="slider-value">
              <span class="utilization-value">{{ tasksetConfig.utilization.toFixed(1) }}</span>
            </div>
          </div>
          <div v-if="utilizationExceedsProcessors" class="warning-message small">
            <span class="warning-icon">⚠️</span>
            <span class="warning-text">Utilization exceeds total processor count ({{ totalProcessorCount }}). This taskset is likely unschedulable.</span>
          </div>
        </div>
        
        <!-- Segment Number -->
        <div class="grid-item">
          <label class="setting-label">Segment Number</label>
          <div class="slider-container">
            <input 
              type="range" 
              min="3" 
              max="30" 
              :value="tasksetConfig.segmentNumber"
              @input="updateSegmentNumber"
              class="segment-slider"
            />
            <div class="slider-value">
              <input 
                type="number" 
                min="3" 
                max="30" 
                :value="tasksetConfig.segmentNumber"
                @input="updateSegmentNumber"
                class="number-input"
              />
            </div>
          </div>
        </div>
        
        <!-- Segment Length Range -->
        <div class="grid-item">
          <div class="setting-header">
            <label class="setting-label">Segment Length Range</label>
            <span class="info-icon" title="This feature is under developing">i</span>
          </div>
          <div class="range-inputs">
            <div class="range-input-item">
              <label style="color: #000;">Min:</label>
              <input 
                type="number" 
                min="1" 
                :max="segmentLengthRange.max"
                :value="segmentLengthRange.min"
                class="number-input small"
                disabled
              />
            </div>
            <div class="range-input-item">
              <label style="color: #000;">Max:</label>
              <input 
                type="number" 
                :min="segmentLengthRange.min"
                max="100"
                :value="segmentLengthRange.max"
                class="number-input small"
                disabled
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Task Model Section (for Random Generation) -->
    <div v-if="tasksetConfig.genMethod === 'Random'" class="config-section">
      <h4>Task Model</h4>
      <div class="task-model-container">
        <div class="model-options">
          <label v-for="model in taskModelOptions" :key="model" class="radio-label">
            <input 
              type="radio" 
              :value="model" 
              v-model="tasksetConfig.taskModel"
              @change="updateTaskModel"
            />
            <span class="radio-text">{{ model }}</span>
          </label>
        </div>
        
        <!-- Edge density (only for DAG) -->
        <div v-if="tasksetConfig.taskModel === 'DAG'" class="edge-density-container">
          <label class="setting-label">Edge Density</label>
          <div class="slider-container">
            <input 
              type="range" 
              min="0.01" 
              max="0.5" 
              step="0.01"
              :value="tasksetConfig.edgeDensity"
              @input="updateEdgeDensity"
              class="edge-slider"
            />
            <div class="slider-value">
              <span class="density-value">{{ (tasksetConfig.edgeDensity * 100).toFixed(0) }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Other Simulation Settings (for Random Generation) -->
    <div v-if="tasksetConfig.genMethod === 'Random'" class="config-section">
      <h4>Other Simulation Settings</h4>
      <div class="settings-row">
        <!-- Random Seed -->
        <div class="setting-item">
          <label class="setting-label">Random Seed</label>
          <input 
            type="number" 
            min="1" 
            max="100000" 
            :value="tasksetConfig.randomSeed"
            @input="updateRandomSeed"
            class="number-input"
          />
        </div>
        
        <!-- Simulation Length -->
        <div class="setting-item">
          <div class="setting-header">
            <label class="setting-label">Simulation Length</label>
            <span class="info-icon" title="Simulation timebound = min(Given length, LCM of periods of each task).">i</span>
          </div>
          <div class="slider-container">
            <input 
              type="range" 
              min="10" 
              max="400" 
              step="0.1"
              :value="tasksetConfig.releaseTimes / 1000"
              @input="(e) => { const value = parseFloat((e.target as HTMLInputElement).value); if (!isNaN(value) && value >= 10 && value <= 400) { tasksetConfig.releaseTimes = value * 1000; } }"
              class="task-slider"
            />
            <div class="slider-value">
              <input 
                type="number" 
                min="10" 
                max="400" 
                step="0.1"
                :value="tasksetConfig.releaseTimes / 1000"
                @input="(e) => { const value = parseFloat((e.target as HTMLInputElement).value); if (!isNaN(value) && value >= 10 && value <= 400) { tasksetConfig.releaseTimes = value * 1000; } }"
                class="number-input"
              />
              <span>x1000 ms</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- User Upload Section -->
    <div v-if="tasksetConfig.genMethod === 'User'" class="config-section">
      <h4>Task Configuration Upload</h4>
      <div class="upload-section">
        <div class="upload-container">
          <input 
            type="file" 
            accept=".json" 
            @change="handleFileUpload"
            class="file-input"
          />
          <div class="button-group">
            <button 
              @click="showDefaultExample"
              class="default-example-button"
            >
              Download Example
            </button>
            <button 
              @click="loadDefaultExample"
              class="load-example-button"
            >
              Load Default Example
            </button>
            <button 
              @click="loadVitLmExample"
              class="load-example-button"
            >
              Load Vit + LM Example
            </button>
            <button 
              @click="loadMlpExample"
              class="load-example-button"
            >
              Load MLP Example
            </button>
          </div>
        </div>
        <div v-if="uploadStatus.message" :class="['upload-status', uploadStatus.success ? 'success' : 'error']">
          {{ uploadStatus.message }}
        </div>
        
        <!-- DAG generation error message -->
        <div v-if="generationError.hasError" class="generation-error">
          {{ generationError.message }}
        </div>
        <div class="json-format-explanation">
          <h5>JSON Format</h5>
          <ul>
            <li><strong>segment</strong>: Segment Length (Execution Time)</li>
            <li><strong>type</strong>: Hardware Affinity (0=CPU, 3=DataCopy, 7=GPU, 8=FPGA)</li>
            <li><strong>other configuration</strong>: Automatically Calculated After Uploading</li>
          </ul>
        </div>
      </div>
      
      <!-- Simulation Length (for User Upload) -->
      <div class="simulation-length-container">
        <div class="setting-header">
          <label class="setting-label">Simulation Length</label>
          <span class="info-icon" title="Simulation timebound = min(Given length, LCM of periods of each task).">i</span>
        </div>
        <div class="slider-container">
          <input 
              type="range" 
              min="10" 
              max="400" 
              step="0.1"
              :value="tasksetConfig.releaseTimes / 1000"
              @input="(e) => { const value = parseFloat((e.target as HTMLInputElement).value); if (!isNaN(value) && value >= 10 && value <= 400) { tasksetConfig.releaseTimes = value * 1000; } }"
              class="task-slider"
            />
          <div class="slider-value">
            <input 
              type="number" 
              min="10" 
              max="400" 
              step="0.1"
              :value="tasksetConfig.releaseTimes / 1000"
              @input="(e) => { const value = parseFloat((e.target as HTMLInputElement).value); if (!isNaN(value) && value >= 10 && value <= 400) { tasksetConfig.releaseTimes = value * 1000; } }"
              class="number-input"
            />
            <span>x1000 ms</span>
          </div>
        </div>
      </div>
    </div>
    

    
    <!-- Task graph visualization button -->
    <div class="visualize-button-container">
      <button 
        @click="showTaskGraphModal = true"
        class="visualize-button"
      >
        Visualize Tasks
      </button>
    </div>
    
    <!-- Display current configuration -->
    <div class="debug-section">
      <h4 class="collapsible-header">
        <span>Current Configuration (For Developers)</span>
        <button @click="debugSectionExpanded = !debugSectionExpanded" class="collapse-button">
          <span class="triangle" :class="{ 'expanded': debugSectionExpanded }"></span>
        </button>
      </h4>
      <pre v-if="debugSectionExpanded">{{ JSON.stringify(displayTasksetConfig, null, 2) }}</pre>
    </div>
    
    <!-- Task graph modal -->
    <div v-if="showTaskGraphModal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Task Graph Visualization</h3>
          <button @click="closeTaskGraphModal" class="close-button">×</button>
        </div>
        <div class="modal-body">
          <!-- Task graph navigation -->
          <div class="task-nav">
            <button 
              @click="prevPage"
              :disabled="currentPage === 1"
              class="nav-button"
            >
              Previous
            </button>
            <span class="page-info">
              Task {{ currentPage }} of {{ totalPages }}
            </span>
            <button 
              @click="nextPage"
              :disabled="currentPage === totalPages"
              class="nav-button"
            >
              Next
            </button>
          </div>
          
          <!-- Task metadata -->
          <div class="task-metadata">
            <h4>Task Information</h4>
            <div class="metadata-grid">
              <div class="metadata-item">
                <span class="metadata-label">Task ID:</span>
                <span class="metadata-value">{{ dagList[currentPage - 1]?.taskId || 'N/A' }}</span>
              </div>
              <div class="metadata-item">
                <span class="metadata-label">Period:</span>
                <span class="metadata-value">{{ dagList[currentPage - 1]?.period || 'N/A' }}</span>
              </div>
              <div class="metadata-item">
                <span class="metadata-label">Deadline:</span>
                <span class="metadata-value">{{ dagList[currentPage - 1]?.period || 'N/A' }}</span>
              </div>
              <div class="metadata-item">
                <span class="metadata-label">Segment Number:</span>
                <span class="metadata-value">{{ dagList[currentPage - 1]?.segmentNumber || 'N/A' }}</span>
              </div>
              <div class="metadata-item">
                <span class="metadata-label">Edge Number:</span>
                <span class="metadata-value">{{ dagList[currentPage - 1]?.edgeNumber || 'N/A' }}</span>
              </div>
            </div>
          </div>
          
          <!-- Task graph container -->
          <div class="task-graph-container">
            <!-- Edges -->
            <svg class="task-edges">
              <line 
                v-for="edge in generatedTasks.edges" 
                :key="edge.id"
                :x1="getNodePosition(edge.source).x + 40"
                :y1="getNodePosition(edge.source).y + 40"
                :x2="getNodePosition(edge.target).x + 40"
                :y2="getNodePosition(edge.target).y + 40"
                class="edge"
              />
            </svg>
            
            <!-- Nodes -->
            <div 
              v-for="node in generatedTasks.nodes" 
              :key="node.id"
              class="task-node"
              :class="node.affinity.toLowerCase()"
              :style="{ left: node.x + 'px', top: node.y + 'px' }"
              @mousedown="handleDragStart($event, node.id)"
            >
              <div class="node-header">
                <span class="node-id">{{ node.name }}</span>
                <span class="node-affinity">{{ node.affinity }}</span>
              </div>
              <div class="node-body">
                <span class="node-time">{{ node.executionTime }}ms</span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeTaskGraphModal" class="cancel-button">Cancel</button>
          <button @click="saveTaskGraph" class="save-button">Save</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.taskset-config-panel {
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
  font-size: 1.2rem;
}

h4 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #555;
  font-size: 1rem;
}

.config-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.config-section {
  flex: 1;
  margin-bottom: 20px;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  transition: all 0.3s ease;
}

.config-section:hover {
  background-color: #f0f9ff;
  border-color: #93c5fd;
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
}

/* Grid layout for Taskset Metadata */
.grid-2x2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.grid-item {
  margin-bottom: 0;
}

/* Task model container */
.task-model-container {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.model-options {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.edge-density-container {
  flex: 1;
}

/* Settings row */
.settings-row {
  display: flex;
  gap: 20px;
}

.setting-item {
  flex: 1;
}

/* Range inputs */
.range-inputs {
  display: flex;
  gap: 10px;
}

.range-input-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

/* Setting labels */
.setting-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #555;
}

/* Setting header with info icon */
.setting-header {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 8px;
}

.info-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: #e5e7eb;
  color: #6b7280;
  font-size: 12px;
  cursor: pointer;
}

/* Small warning message */
.warning-message.small {
  font-size: 0.8rem;
  margin-top: 5px;
}

/* Small number input */
.number-input.small {
  width: 60px;
}

/* Simulation length container for user upload */
.simulation-length-container {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
}

.slider-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.task-slider,
.utilization-slider,
.edge-slider,
.segment-slider,
.seed-slider {
  flex: 1;
  height: 20px;
  border-radius: 10px;
  background: white;
  outline: none;
  appearance: none;
  -webkit-appearance: none;
  border: 1px solid rgba(59, 130, 246, 0.5);
  position: relative;
}

.task-slider::-webkit-slider-runnable-track,
.utilization-slider::-webkit-slider-runnable-track,
.edge-slider::-webkit-slider-runnable-track,
.segment-slider::-webkit-slider-runnable-track,
.seed-slider::-webkit-slider-runnable-track {
  height: 2px;
  background: #ddd;
  position: relative;
  top: 50%;
  transform: translateY(-50%);
}

.task-slider::-webkit-slider-thumb,
.utilization-slider::-webkit-slider-thumb,
.edge-slider::-webkit-slider-thumb,
.segment-slider::-webkit-slider-thumb,
.seed-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgba(59, 130, 246, 0.8);
  cursor: pointer;
  margin-top: -7px;
  transition: all 0.2s ease;
}

.task-slider::-webkit-slider-thumb:hover,
.utilization-slider::-webkit-slider-thumb:hover,
.edge-slider::-webkit-slider-thumb:hover,
.segment-slider::-webkit-slider-thumb:hover,
.seed-slider::-webkit-slider-thumb:hover {
  background: rgba(37, 99, 235, 1);
  transform: scale(1.1);
}

.task-slider::-webkit-slider-thumb:active,
.utilization-slider::-webkit-slider-thumb:active,
.edge-slider::-webkit-slider-thumb:active,
.segment-slider::-webkit-slider-thumb:active,
.seed-slider::-webkit-slider-thumb:active {
  background: #c084fc;
  transform: scale(1.1);
}

/* Task metadata styles */
.task-metadata {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.task-metadata h4 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #334155;
  font-size: 1rem;
}

.metadata-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
}

.metadata-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.metadata-label {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
}

.metadata-value {
  font-size: 1rem;
  color: #1e293b;
  font-weight: 600;
}

/* Task graph container styles */
.task-graph-container {
  position: relative;
  width: 100%;
  height: 600px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: auto;
  background-color: #ffffff;
  margin-top: 20px;
}

.task-edges {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.edge {
  stroke: #94a3b8;
  stroke-width: 2;
  fill: none;
}

.task-node {
  position: absolute;
  width: 80px;
  min-height: 80px;
  border-radius: 8px;
  padding: 8px;
  cursor: move;
  z-index: 2;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.task-node:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.task-node.cpu {
  background-color: #dbeafe;
  border: 1px solid #3b82f6;
}

.task-node.gpu {
  background-color: #dcfce7;
  border: 1px solid #006400;
}

.task-node.datacopy {
  background-color: #fef3c7;
  border: 1px solid #b8860b;
}

.task-node.fpga {
  background-color: #ede9fe;
  border: 1px solid #8b5cf6;
}

.task-node.any {
  background-color: #f1f5f9;
  border: 1px solid #64748b;
}

.node-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.node-id {
  font-size: 0.875rem;
  font-weight: 600;
  color: #334155;
}

.node-affinity {
  font-size: 0.75rem;
  font-weight: 500;
  padding: 2px 6px;
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.05);
  color: #64748b;
}

.node-body {
  font-size: 0.75rem;
  color: #64748b;
}

.node-time {
  font-weight: 500;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  width: 90%;
  max-width: 1200px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h3 {
  margin: 0;
  color: #1e293b;
  font-size: 1.25rem;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #64748b;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.close-button:hover {
  background-color: #f1f5f9;
  color: #334155;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #e2e8f0;
}

.cancel-button {
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background-color: white;
  color: #374151;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.cancel-button:hover {
  background-color: #f9fafb;
  border-color: #9ca3af;
}

.save-button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background-color: #3b82f6;
  color: white;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.save-button:hover {
  background-color: #2563eb;
}

/* Task navigation styles */
.task-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding: 10px;
  background-color: #f8fafc;
  border-radius: 8px;
}

.nav-button {
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background-color: white;
  color: #374151;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.nav-button:hover:not(:disabled) {
  background-color: #f9fafb;
  border-color: #9ca3af;
}

.nav-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
}

.task-slider::-moz-range-track,
.utilization-slider::-moz-range-track,
.edge-slider::-moz-range-track,
.segment-slider::-moz-range-track,
.seed-slider::-moz-range-track {
  height: 2px;
  background: #ddd;
  border-radius: 1px;
}

.task-slider::-moz-range-thumb,
.utilization-slider::-moz-range-thumb,
.edge-slider::-moz-range-thumb,
.segment-slider::-moz-range-thumb,
.seed-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgba(59, 130, 246, 0.8);
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
}

.task-slider::-moz-range-thumb:hover,
.utilization-slider::-moz-range-thumb:hover,
.edge-slider::-moz-range-thumb:hover,
.segment-slider::-moz-range-thumb:hover,
.seed-slider::-moz-range-thumb:hover {
  background: rgba(37, 99, 235, 1);
  transform: scale(1.1);
}

.task-slider::-moz-range-thumb:active,
.utilization-slider::-moz-range-thumb:active,
.edge-slider::-moz-range-thumb:active,
.segment-slider::-moz-range-thumb:active,
.seed-slider::-moz-range-thumb:active {
  background: #c084fc;
  transform: scale(1.1);
}

.slider-value {
  min-width: 60px;
  text-align: center;
  color: black;
}

.number-input {
  width: 60px;
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: 4px;
  text-align: center;
}

.radio-group {
  display: flex;
  gap: 20px;
  margin-top: 10px;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 4px;
  transition: all 0.3s ease;
  margin-right: 10px;
}

.radio-label:hover {
  background-color: #e6f7ff;
}

.radio-label input[type="radio"] {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border: 2px solid #3498db;
  border-radius: 50%;
  outline: none;
  transition: all 0.3s ease;
  position: relative;
}

.radio-label input[type="radio"]:checked {
  background-color: #3498db;
}

.radio-label input[type="radio"]:checked::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: white;
}



.radio-text {
  font-size: 0.9rem;
  color: #333;
  font-weight: 500;
}

.warning-message {
  margin-top: 10px;
  padding: 10px;
  background-color: #fff3cd;
  border: 1px solid #ffeeba;
  border-radius: 4px;
  color: #856404;
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.warning-icon {
  font-size: 1.2rem;
  margin-top: 2px;
}

.warning-text {
  font-size: 0.9rem;
  flex: 1;
}

.visualize-button-container {
  margin-top: 20px;
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
}

.visualize-button {
  background-color: rgba(59, 130, 246, 0.8);
  color: white;
  padding: 0.75rem 1.5rem;
  border: 1px solid rgba(59, 130, 246, 0.5);
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.visualize-button:hover {
  background-color: rgba(37, 99, 235, 1);
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.4);
}

/* JSON format explanation styles */
.json-format-explanation {
  margin-top: 15px;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.json-format-explanation h5 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #495057;
  font-size: 0.95rem;
  font-weight: 600;
}

.json-format-explanation ul {
  margin: 0;
  padding-left: 20px;
}

.json-format-explanation li {
  margin-bottom: 5px;
  color: #495057;
  font-size: 0.9rem;
}

.json-format-explanation strong {
  color: #343a40;
  font-weight: 600;
}

/* Debug section styles (matching HardwareConfigPanel) */
.debug-section {
  background-color: var(--bg-glass);
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  margin-top: 1rem;
  backdrop-filter: blur(10px);
}

.collapsible-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
  font-size: 1rem;
  cursor: pointer;
}

.collapse-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  margin-left: 10px;
}

.triangle {
  display: inline-block;
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 8px solid var(--text-primary);
  transition: transform 0.3s ease;
}

.triangle.expanded {
  transform: rotate(180deg);
}

.debug-section pre {
  background-color: rgba(255, 255, 255, 0.8);
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
  color: var(--text-secondary);
  font-size: 0.9rem;
  border: 1px solid var(--border-color);
  margin: 0;
  font-family: 'Courier New', Courier, monospace;
  line-height: 1.4;
  white-space: pre-wrap;
  word-wrap: break-word;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 1000px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #ddd;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
}

.close-button:hover {
  color: #333;
}

.modal-body {
  padding: 20px;
  flex: 1;
  overflow-y: auto;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid #ddd;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.cancel-button {
  background-color: #f1f1f1;
  color: #333;
  padding: 10px 20px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.cancel-button:hover {
  background-color: #e0e0e0;
}

.save-button {
  background-color: #4CAF50;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.save-button:hover {
  background-color: #45a049;
}

/* Task graph styles */
.task-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.nav-button {
  background-color: #f1f1f1;
  color: #333;
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.nav-button:hover:not(:disabled) {
  background-color: #e0e0e0;
}

.nav-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.9rem;
  color: #666;
}

.task-graph-container {
  position: relative;
  width: 100%;
  height: 600px;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
  background-color: #f9f9f9;
}

.task-edges {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.edge {
  stroke: #999;
  stroke-width: 2;
  fill: none;
}

.task-node {
  position: absolute;
  width: 80px;
  height: 80px;
  background-color: #fff;
  border: 2px solid #4CAF50;
  border-radius: 8px;
  padding: 8px;
  box-sizing: border-box;
  cursor: move;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.3s;
}

.task-node:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.task-node.cpu {
  border-color: #2196F3;
}

.task-node.gpu {
  border-color: #006400;
}

.task-node.datacopy {
  border-color: #b8860b;
}

.task-node.fpga {
  border-color: #795548;
}

.task-node.any {
  border-color: #9E9E9E;
}

.node-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.node-id {
  font-size: 0.7rem;
  color: #333;
}

.node-affinity {
  font-size: 0.7rem;
  color: #666;
  background-color: #f1f1f1;
  padding: 2px 4px;
  border-radius: 2px;
}

.node-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}


.node-time {
  font-size: 0.7rem;
  color: #333;
  font-weight: bold;
}

/* Upload section styles */
.upload-section {
  margin-top: 15px;
}

.upload-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 10px;
}

.file-input {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.button-group {
  display: flex;
  gap: 10px;
}

.default-example-button {
  background-color: #2196F3;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.load-example-button {
  background-color: white;
  color: #333;
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.load-example-button:hover {
  background-color: #f0f0f0;
  border-color: #93c5fd;
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.2);
}

.json-format-explanation {
  margin-top: 15px;
  padding: 10px;
  background-color: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 0.9rem;
  line-height: 1.4;
}

.json-format-explanation h5 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #555;
  font-size: 1rem;
}

.json-format-explanation ul {
  margin: 0;
  padding-left: 20px;
}

.json-format-explanation li {
  margin-bottom: 5px;
}

.default-example-button:hover {
  background-color: #1976D2;
}

.upload-status {
  padding: 10px;
  border-radius: 4px;
  font-size: 0.9rem;
  margin-top: 10px;
}

.upload-status.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.upload-status.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.generation-error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  padding: 10px;
  border-radius: 4px;
  font-size: 0.9rem;
  margin-top: 10px;
  white-space: pre-wrap;
  font-family: monospace;
}

/* Range input container */
.range-input-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.range-input {
  display: flex;
  align-items: center;
  gap: 5px;
}

.range-separator {
  color: #666;
  font-weight: bold;
}

@media (max-width: 768px) {
  .config-row {
    flex-direction: column;
  }
  
  .radio-group {
    flex-direction: column;
    gap: 10px;
  }
  
  .upload-container {
    flex-direction: column;
  }
  
  .modal-content {
    width: 95%;
    max-height: 90vh;
  }
  
  .task-graph-container {
    height: 400px;
  }
}
</style>