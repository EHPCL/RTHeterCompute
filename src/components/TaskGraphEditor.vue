<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import type { TasksetConfig, TaskNode, TaskEdge, TaskSegment } from '../types/api'

const props = defineProps<{
  tasksetConfig?: TasksetConfig
}>()

const emit = defineEmits<{
  'update:taskset': [config: TasksetConfig]
}>()

// Task nodes and edges
const taskNodes = ref<TaskNode[]>([])
const taskEdges = ref<TaskEdge[]>([])

// Node property panel state
const selectedNode = ref<TaskNode | null>(null)
const showPropertyPanel = ref(false)

// Segment management for self-suspension mode
const segments = ref<TaskSegment[]>([])

// Node types and affinity options
const affinityOptions = ref<string[]>(['CPU', 'GPU', 'DATACOPY', 'FPGA'])

// Canvas state
const canvasRef = ref<HTMLDivElement | null>(null)
const isDragging = ref(false)
const draggedNode = ref<TaskNode | null>(null)
const dragOffset = reactive({ x: 0, y: 0 })

// Initialize with default nodes based on task count
watch(() => props.tasksetConfig?.taskCount, (newCount) => {
  if (newCount && newCount > 0) {
    initializeNodes(newCount)
  }
}, { immediate: true })

// Initialize default nodes
const initializeNodes = (count: number) => {
  taskNodes.value = []
  taskEdges.value = []
  
  for (let i = 0; i < count; i++) {
    taskNodes.value.push({
      id: `task-${i}`,
      name: `Task ${i}`,
      type: 'Compute',
      executionTime: 10,
      affinity: 'CPU',
      period: 100,
      deadline: 100,
      x: 50 + (i % 5) * 150,
      y: 50 + Math.floor(i / 5) * 150
    })
  }
}

// Add a new task node
const addTaskNode = () => {
  const newId = `task-${taskNodes.value.length}`
  
  // Find a suitable position for the new node
  let newX = 100
  let newY = 100
  const nodeWidth = 150
  const nodeHeight = 120
  const spacing = 20
  
  if (taskNodes.value.length > 0) {
    // Check existing nodes to avoid overlap
    let attempts = 0
    const maxAttempts = 50
    let isOverlapping = false
    
    do {
      isOverlapping = false
      
      // Try to find a position in a grid pattern
      const gridSize = Math.ceil(Math.sqrt(taskNodes.value.length + 1))
      const index = taskNodes.value.length
      newX = 50 + (index % gridSize) * (nodeWidth + spacing)
      newY = 50 + Math.floor(index / gridSize) * (nodeHeight + spacing)
      
      // Check for overlap with existing nodes
      for (const node of taskNodes.value) {
        const dx = newX - node.x
        const dy = newY - node.y
        if (Math.abs(dx) < nodeWidth + spacing && Math.abs(dy) < nodeHeight + spacing) {
          isOverlapping = true
          // Try a different position
          newX += nodeWidth + spacing
          break
        }
      }
      
      attempts++
    } while (isOverlapping && attempts < maxAttempts)
  }
  
  taskNodes.value.push({
    id: newId,
    name: `Task ${taskNodes.value.length}`,
    type: 'Compute',
    executionTime: 10,
    affinity: 'CPU',
    period: 100,
    deadline: 100,
    x: newX,
    y: newY
  })
  selectNode(newId)
}

// Remove selected node
const removeSelectedNode = () => {
  if (selectedNode.value) {
    // Remove node
    const index = taskNodes.value.findIndex((n: TaskNode) => n.id === selectedNode.value?.id)
    if (index !== -1) {
      taskNodes.value.splice(index, 1)
    }
    
    // Remove connected edges
    taskEdges.value = taskEdges.value.filter(
      (e: TaskEdge) => e.source !== selectedNode.value?.id && e.target !== selectedNode.value?.id
    )
    
    // Clear selection
    selectedNode.value = null
    showPropertyPanel.value = false
  }
}

// Select a node
const selectNode = (nodeId: string) => {
  selectedNode.value = taskNodes.value.find((n: TaskNode) => n.id === nodeId) || null
  showPropertyPanel.value = selectedNode.value !== null
}

// Handle node drag start
const handleDragStart = (node: TaskNode, event: MouseEvent) => {
  draggedNode.value = node
  isDragging.value = true
  
  // Calculate offset
  const rect = (event.target as HTMLElement).getBoundingClientRect()
  dragOffset.x = event.clientX - rect.left
  dragOffset.y = event.clientY - rect.top
}

// Handle node dragging
const handlePan = (event: MouseEvent) => {
  if (isDragging.value && draggedNode.value && canvasRef.value) {
    const rect = canvasRef.value.getBoundingClientRect()
    draggedNode.value.x = event.clientX - rect.left - dragOffset.x
    draggedNode.value.y = event.clientY - rect.top - dragOffset.y
  }
}

// Handle node drag end
const handlePanEnd = () => {
  if (isDragging.value) {
    isDragging.value = false
    draggedNode.value = null
  }
}

// Add edge between nodes (currently not used)
// const addEdge = (sourceId: string, targetId: string) => {
//   // Check if edge already exists
//   const existingEdge = taskEdges.value.find(
//     (e: TaskEdge) => e.source === sourceId && e.target === targetId
//   )
//   
//   // if (!existingEdge) {
//   //   taskEdges.value.push({
//   //     id: `edge-${sourceId}-${targetId}`,
//   //     source: sourceId,
//   //     target: targetId
//   //   })
//   // }
// }

// Remove edge
const removeEdge = (edgeId: string) => {
  const index = taskEdges.value.findIndex((e: TaskEdge) => e.id === edgeId)
  if (index !== -1) {
    taskEdges.value.splice(index, 1)
  }
}

// Update node property
const updateNodeProperty = <K extends keyof TaskNode>(property: K, value: TaskNode[K]) => {
  if (selectedNode.value) {
    selectedNode.value[property] = value
  }
}

// Add segment for self-suspension mode
const addSegment = () => {
  segments.value.push({
    id: `segment-${segments.value.length}`,
    type: 'CPU',
    executionTime: 5,
    affinity: 'CPU'
  })
}

// Remove segment
const removeSegment = (segmentId: string) => {
  const index = segments.value.findIndex((s: TaskSegment) => s.id === segmentId)
  if (index !== -1) {
    segments.value.splice(index, 1)
  }
}

// Update segment property
const updateSegmentProperty = <K extends keyof TaskSegment>(segmentId: string, property: K, value: TaskSegment[K]) => {
  const segment = segments.value.find((s: TaskSegment) => s.id === segmentId)
  if (segment) {
    segment[property] = value
  }
}

// Import taskset from JSON
const importTaskset = (event: Event) => {
  const fileInput = event.target as HTMLInputElement
  if (fileInput.files && fileInput.files.length > 0) {
    const file = fileInput.files[0]
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        if (data.nodes) taskNodes.value = data.nodes
        if (data.edges) taskEdges.value = data.edges
        if (data.segments) segments.value = data.segments
      } catch (error) {
        console.error('Error importing taskset:', error)
      }
    }
    
    reader.readAsText(file as Blob)
  }
}

// Export taskset to JSON
const exportTaskset = () => {
  const data = {
    nodes: taskNodes.value,
    edges: taskEdges.value,
    segments: segments.value
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'taskset.json'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="task-graph-editor">
    <h3>Task Graph Editor</h3>
    
    <!-- Toolbar -->
    <div class="toolbar">
      <button class="toolbar-btn" @click="addTaskNode">Add Task</button>
      <button class="toolbar-btn" @click="removeSelectedNode" :disabled="!selectedNode">Remove Task</button>
      <button class="toolbar-btn" @click="exportTaskset">Export JSON</button>
      <label class="toolbar-btn file-input-label">
        Import JSON
        <input type="file" accept=".json" @change="importTaskset" style="display: none;">
      </label>
    </div>
    
    <div class="editor-container">
      <!-- Canvas -->
      <div class="canvas-container" ref="canvasRef" @mousemove="handlePan" @mouseup="handlePanEnd" @mouseleave="handlePanEnd">
        
        <!-- Inner canvas -->
        <div class="inner-canvas">
          <!-- Task nodes -->
          <div 
            v-for="node in taskNodes" 
            :key="node.id"
            class="task-node"
            :style="{ 
              left: node.x + 'px', 
              top: node.y + 'px',
              borderColor: node.affinity === 'FPGA' ? '#9333ea' : '#3b82f6',
              '--selected-border-color': node.affinity === 'FPGA' ? '#7e22ce' : '#2563eb',
              '--selected-shadow-color': node.affinity === 'FPGA' ? 'rgba(147, 51, 234, 0.3)' : 'rgba(59, 130, 246, 0.3)'
            }"
            @mousedown="handleDragStart(node, $event)"
            @click="selectNode(node.id)"
            :class="{ 'selected': selectedNode?.id === node.id }"
          >
            <div 
              class="node-header"
              :style="{ 
                backgroundColor: node.affinity === 'FPGA' ? '#9333ea' : '#3b82f6'
              }"
            >{{ node.name }}</div>
            <div class="node-body">
              <div class="node-time">{{ node.executionTime }}ms</div>
              <div class="node-metadata">
                <div class="metadata-item">ID: {{ parseInt(node.id.split('-')[1] || '0') }}</div>
                <div class="metadata-item">Period: {{ node.period || 100 }}</div>
                <div class="metadata-item">Deadline: {{ node.period || 100 }}</div>
                <div class="metadata-item">Nodes: {{ taskNodes.length }}</div>
                <div class="metadata-item">Edges: {{ taskEdges.length }}</div>
                <div class="metadata-item">Segments: {{ segments.length }}</div>
              </div>
            </div>
          </div>
          
          <!-- Task edges -->
          <svg class="edges-container">
            <line 
              v-for="edge in taskEdges" 
              :key="edge.id"
              :x1="(taskNodes.find(n => n.id === edge.source)?.x || 0) + 75"
              :y1="(taskNodes.find(n => n.id === edge.source)?.y || 0) + 50"
              :x2="(taskNodes.find(n => n.id === edge.target)?.x || 0) + 75"
              :y2="taskNodes.find(n => n.id === edge.target)?.y || 0"
              class="task-edge"
              @click="removeEdge(edge.id)"
            />
          </svg>
        </div>
      </div>
      
      <!-- Property panel -->
      <div class="property-panel" v-if="showPropertyPanel && selectedNode">
        <div class="panel-header">
          <h4>Node Properties</h4>
          <button class="close-btn" @click="showPropertyPanel = false">&times;</button>
        </div>
        
        <div class="panel-content">
          <div class="property-group">
            <label for="node-name">Name/ID:</label>
            <input 
              id="node-name"
              type="text" 
              v-model="selectedNode.name"
              @input="updateNodeProperty('name', selectedNode.name)"
            />
          </div>
          
          <div class="property-group">
            <label for="node-time">Execution Time (ms):</label>
            <input 
              id="node-time"
              type="number" 
              min="1"
              v-model.number="selectedNode.executionTime"
              @input="updateNodeProperty('executionTime', selectedNode.executionTime)"
            />
          </div>
          
          <div class="property-group">
            <label for="node-affinity">Affinity:</label>
            <select 
              id="node-affinity"
              v-model="selectedNode.affinity"
              @change="updateNodeProperty('affinity', selectedNode.affinity)"
            >
              <option v-for="affinity in affinityOptions" :key="affinity" :value="affinity">{{ affinity }}</option>
            </select>
          </div>
          
          <div class="property-group">
            <label for="node-period">Period:</label>
            <input 
              id="node-period"
              type="number" 
              min="1"
              v-model.number="selectedNode.period"
              @input="updateNodeProperty('period', selectedNode.period)"
            />
          </div>
          
          <div class="property-group">
            <label for="node-deadline">Deadline:</label>
            <input 
              id="node-deadline"
              type="number" 
              min="1"
              v-model.number="selectedNode.deadline"
              @input="updateNodeProperty('deadline', selectedNode.deadline)"
            />
          </div>
        </div>
      </div>
      
      <!-- Segment management (for self-suspension mode) -->
      <div v-if="tasksetConfig?.taskModel === 'Suspension'" class="segment-panel">
        <h4>Segments</h4>
        
        <div class="segments-list">
          <div v-for="segment in segments" :key="segment.id" class="segment-item">
            <div class="segment-controls">
              <select v-model="segment.type" @change="updateSegmentProperty(segment.id, 'type', segment.type)">
                <option value="CPU">CPU</option>
                <option value="GPU">GPU</option>
                <option value="Datacopy">Datacopy</option>
                <option value="FPGA">FPGA</option>
              </select>
              <input 
                type="number" 
                min="1" 
                v-model.number="segment.executionTime"
                @input="updateSegmentProperty(segment.id, 'executionTime', segment.executionTime)"
                placeholder="Time"
              />
              <select v-model="segment.affinity" @change="updateSegmentProperty(segment.id, 'affinity', segment.affinity)">
                <option v-for="affinity in affinityOptions" :key="affinity" :value="affinity">{{ affinity }}</option>
              </select>
              <button class="remove-segment-btn" @click="removeSegment(segment.id)">×</button>
            </div>
          </div>
        </div>
        
        <button class="add-segment-btn" @click="addSegment">Add Segment</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
:root {
  --border-color: #e5e7eb;
  --text-primary: #1f2937;
  --text-secondary: #6b7280;
  --primary-color: #3b82f6;
  --primary-glow: rgba(59, 130, 246, 0.3);
  --transition: all 0.2s ease;
}

.task-graph-editor {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.toolbar {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  background-color: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.toolbar-btn {
  padding: 0.5rem 1rem;
  background-color: rgba(59, 130, 246, 0.8);
  color: white;
  border: 1px solid rgba(59, 130, 246, 0.5);
  border-radius: 4px;
  cursor: pointer;
  transition: var(--transition);
  font-weight: 500;
}

.toolbar-btn:hover {
  background-color: rgba(37, 99, 235, 1);
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.4);
}

.toolbar-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.file-input-label {
  cursor: pointer;
}

.editor-container {
  display: flex;
  gap: 1rem;
  flex: 1;
}

.canvas-container {
  flex: 1;
  position: relative;
  background-color: rgba(243, 244, 246, 0.8);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: auto;
  min-height: 350px;
  min-width: 800px;
  cursor: default;
}

.inner-canvas {
  position: relative;
  overflow: auto;
  width: 1000px;
  height: 1000px;
}



.task-node {
  position: absolute;
  width: 150px;
  border: 2px solid #3b82f6;
  border-radius: 8px;
  background-color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  cursor: move;
  transition: all 0.2s ease;
}

.task-node.selected {
  border-color: var(--selected-border-color, #2563eb);
  box-shadow: 0 0 0 3px var(--selected-shadow-color, rgba(59, 130, 246, 0.3));
}

.node-header {
  padding: 0.5rem;
  background-color: #3b82f6;
  color: white;
  font-weight: 500;
  border-top-left-radius: 6px;
  border-top-right-radius: 6px;
  text-align: center;
}

.node-body {
  padding: 0.75rem;
  text-align: center;
}



.node-time {
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.5rem;
}

.node-metadata {
  font-size: 0.8rem;
  color: #6b7280;
  text-align: left;
}

.metadata-item {
  margin-bottom: 0.25rem;
}

.edges-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 200%;
  height: 200%;
  pointer-events: none;
  z-index: 1;
  overflow: visible;
}

.task-edge {
  stroke: #6b7280;
  stroke-width: 2px;
  fill: none;
  pointer-events: all;
  cursor: pointer;
}

.task-edge:hover {
  stroke: #3b82f6;
}

.property-panel {
  width: 300px;
  background-color: rgba(255, 255, 255, 0.9);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #f3f4f6;
  border-bottom: 1px solid var(--border-color);
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}

.panel-header h4 {
  margin: 0;
  color: var(--text-primary);
  font-size: 1.1rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.panel-content {
  padding: 1rem;
}

.property-group {
  margin-bottom: 1rem;
}

.property-group label {
  display: block;
  margin-bottom: 0.25rem;
  color: var(--text-primary);
  font-weight: 500;
  font-size: 0.9rem;
}

.property-group input,
.property-group select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: white;
  color: var(--text-primary);
  font-size: 0.9rem;
  transition: var(--transition);
}

.property-group input:focus,
.property-group select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px var(--primary-glow);
}

.segment-panel {
  width: 300px;
  background-color: rgba(255, 255, 255, 0.9);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 1rem;
}

.segment-panel h4 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: var(--text-primary);
  font-size: 1.1rem;
}

.segments-list {
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.segment-item {
  padding: 0.75rem;
  background-color: rgba(243, 244, 246, 0.8);
  border-radius: 4px;
  border: 1px solid var(--border-color);
}

.segment-controls {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.segment-controls select,
.segment-controls input {
  flex: 1;
  padding: 0.375rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: white;
  font-size: 0.65rem;
}

.remove-segment-btn {
  width: 24px;
  height: 24px;
  padding: 0;
  background-color: rgba(220, 38, 38, 0.8);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  line-height: 1;
}

.add-segment-btn {
  width: 100%;
  padding: 0.5rem;
  background-color: rgba(22, 163, 74, 0.8);
  color: white;
  border: 1px solid rgba(22, 163, 74, 0.5);
  border-radius: 4px;
  cursor: pointer;
  transition: var(--transition);
  font-weight: 500;
}

.add-segment-btn:hover {
  background-color: rgba(21, 128, 61, 1);
  box-shadow: 0 0 10px rgba(22, 163, 74, 0.4);
}
</style>