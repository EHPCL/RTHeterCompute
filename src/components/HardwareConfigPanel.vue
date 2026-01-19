<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Processor, HardwareConfig } from '../types/api'

const props = defineProps<{
  modelValue?: HardwareConfig
}>()

const emit = defineEmits<{
  'update:modelValue': [config: HardwareConfig]
}>()

const processors = ref<Processor[]>(props.modelValue?.processors || [])
const debugSectionExpanded = ref(false)

// Watch for changes and emit updates
watch(processors, (newProcessors) => {
  emit('update:modelValue', { processors: newProcessors })
}, { deep: true })

// Sort processors by fixed priority: CPU → DATACOPY → GPU → FPGA
const sortedProcessors = computed(() => {
  const priorityOrder = ['CPU', 'DATACOPY', 'GPU', 'FPGA']
  return processors.value.slice().sort((a, b) => {
    return priorityOrder.indexOf(a.type) - priorityOrder.indexOf(b.type)
  })
})

// Processor types available
const processorTypes = ['CPU', 'DATACOPY', 'GPU', 'FPGA'] as const

// Add a new processor type
const addProcessor = (type: Processor['type']) => {
  const existingProcessor = processors.value.find(p => p.type === type)
  if (!existingProcessor) {
    processors.value.push({ 
      type, 
      count: 1, 
      preemptive: type !== 'GPU' && type !== 'DATACOPY' && type !== 'FPGA' // GPU, DATACOPY, and FPGA are non-preemptive by default
    })
  }
}

// Remove a processor type
const removeProcessor = (type: Processor['type']) => {
  const index = processors.value.findIndex(p => p.type === type)
  if (index !== -1) {
    processors.value.splice(index, 1)
  }
}

// Update processor count
const updateProcessorCount = (type: Processor['type'], count: number) => {
  const processor = processors.value.find(p => p.type === type)
  if (processor && count > 0) {
    processor.count = count
  }
}

// Update processor preemptive mode
const updateProcessorPreemptive = (type: Processor['type'], preemptive: boolean) => {
  const processor = processors.value.find(p => p.type === type)
  if (processor) {
    processor.preemptive = preemptive
  }
}

// Template presets
const applyTemplate = (template: string) => {
  switch (template) {
    case 'jetson':
      processors.value = [
        { type: 'CPU', count: 2, preemptive: true },
        { type: 'DATACOPY', count: 2, preemptive: false },
        { type: 'GPU', count: 2, preemptive: false }
      ]
      break
    case 'light':
      processors.value = [
        { type: 'CPU', count: 1, preemptive: true },
        { type: 'GPU', count: 1, preemptive: false }
      ]
      break
    case 'xilinx':
      processors.value = [
        { type: 'CPU', count: 2, preemptive: true },
        { type: 'FPGA', count: 2, preemptive: false }
      ]
      break
    case 'custom':
      processors.value = []
      break
  }
}
</script>

<template>
  <div class="hardware-config-panel">
    <h3>Hardware Configuration</h3>
    
    <!-- Template buttons -->
    <div class="template-section">
      <h4>Templates</h4>
      <div class="template-buttons">
        <button class="template-btn" @click="applyTemplate('jetson')">Jetson-like (2 CPU, 2 Copy, 2 GPU)</button>
        <button class="template-btn" @click="applyTemplate('light')">Light (1 CPU, 1 GPU)</button>
        <button class="template-btn" @click="applyTemplate('xilinx')">Xilinx-like (2 CPU, 2 FPGA)</button>
        <button class="template-btn" @click="applyTemplate('custom')">Custom</button>
      </div>
    </div>
    
    <!-- Processor types selector -->
    <div class="processor-types">
      <h4>Processor Types</h4>
      <div class="type-selectors">
        <div v-for="type in processorTypes" :key="type" class="type-selector">
          <label>
            <input 
              type="checkbox" 
              :checked="processors.some(p => p.type === type)" 
              @change="(event) => {
                const target = event.target as HTMLInputElement;
                target.checked ? addProcessor(type) : removeProcessor(type);
              }"
            />
            {{ type }}
          </label>
        </div>
      </div>
    </div>
    
    <!-- Processor configurations -->
    <div class="processor-configs" v-if="sortedProcessors.length > 0">
      <h4>Processor Details</h4>
      <div v-for="processor in sortedProcessors" :key="processor.type" class="processor-config">
        <div class="config-header">
          <h5>{{ processor.type }}</h5>
        </div>
        
        <div class="config-fields">
          <div class="config-field">
            <label for="count-{{ processor.type }}">Count:</label>
            <input 
              id="count-{{ processor.type }}"
              type="number" 
              min="1" 
              v-model.number="processor.count"
              @input="updateProcessorCount(processor.type, processor.count)"
            />
          </div>
          
          <div class="config-field">
            <label for="preemptive-{{ processor.type }}">Preemptive:</label>
            <input 
              id="preemptive-{{ processor.type }}"
              type="checkbox" 
              v-model="processor.preemptive"
              @change="updateProcessorPreemptive(processor.type, processor.preemptive)"
            />
          </div>
        </div>
      </div>
    </div>
    
    <!-- Debug output -->
    <div class="debug-section" v-if="sortedProcessors.length > 0">
      <h4 class="collapsible-header">
        <span>Current Configuration (For Developers)</span>
        <button @click="debugSectionExpanded = !debugSectionExpanded" class="collapse-button">
          <span class="triangle" :class="{ 'expanded': debugSectionExpanded }"></span>
        </button>
      </h4>
      <pre v-if="debugSectionExpanded">{{ JSON.stringify(sortedProcessors, null, 2) }}</pre>
    </div>
  </div>
</template>

<style scoped>
.hardware-config-panel {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.template-section, .processor-types, .processor-configs {
  background-color: var(--bg-glass);
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  backdrop-filter: blur(10px);
  transition: var(--transition);
}

.template-section:hover, .processor-types:hover, .processor-configs:hover {
  background-color: var(--bg-glass-hover);
  border-color: var(--border-hover);
  box-shadow: 0 5px 15px var(--primary-glow);
}

.template-section h4, .processor-types h4, .processor-configs h4 {
  margin-bottom: 1rem;
  color: var(--text-primary);
  font-size: 1.1rem;
}

.template-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.template-btn {
  padding: 0.5rem 1rem;
  background-color: var(--bg-glass);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
  transition: var(--transition);
}

.template-btn:hover {
  background-color: var(--bg-glass-hover);
  box-shadow: 0 0 10px var(--primary-glow);
  border-color: var(--border-hover);
}

.type-selectors {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.type-selector label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  color: var(--text-primary);
}

.processor-configs {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.processor-config {
  background-color: rgba(255, 255, 255, 0.8);
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  transition: var(--transition);
}

.processor-config:hover {
  border-color: var(--border-hover);
  box-shadow: 0 0 10px var(--primary-glow);
}

.config-header h5 {
  margin-bottom: 1rem;
  color: var(--primary-color);
  font-size: 1rem;
}

.config-fields {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.config-field {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.config-field label {
  color: var(--text-primary);
  font-weight: 500;
}

.config-field input[type="number"] {
  padding: 0.5rem;
  background-color: rgba(255, 255, 255, 0.8);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  width: 80px;
  transition: var(--transition);
}

.config-field input[type="number"]:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px var(--primary-glow);
}

.config-field input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: var(--primary-color);
}

.debug-section {
  background-color: var(--bg-glass);
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  margin-top: 1rem;
  backdrop-filter: blur(10px);
}

.debug-section h4 {
  margin-bottom: 0.5rem;
  color: var(--text-primary);
  font-size: 1rem;
}

.debug-section pre {
  background-color: rgba(255, 255, 255, 0.8);
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
  color: var(--text-secondary);
  font-size: 0.9rem;
  border: 1px solid var(--border-color);
}

.collapsible-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
  font-size: 1rem;
}

.collapse-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  margin-left: 0.5rem;
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
</style>