// API Types for RTHeterSim backend communication

// Hardware configuration types
export interface Processor {
  type: 'CPU' | 'GPU' | 'DATACOPY' | 'FPGA';
  count: number;
  preemptive: boolean;
}

export interface HardwareConfig {
  processors: Processor[];
}

// Task configuration types
export type TaskModel = 'DAG' | 'Suspension';

export interface TasksetConfig {
  taskCount: number;
  taskModel: TaskModel;
  edgeDensity: number;
  utilization: number;
  segmentNumber: number;
  segmentLengthMin?: number;
  segmentLengthMax?: number;
  releaseTimes: number;
  randomSeed: number;
  genMethod: 'User' | 'Random';
}

// Task graph types
export interface TaskNode {
  id: string;
  name: string;
  type: 'Compute' | 'Datacopy' | 'I/O';
  executionTime: number;
  affinity: 'CPU' | 'GPU' | 'DATACOPY' | 'FPGA' | 'Any';
  x: number;
  y: number;
  period?: number;
  deadline?: number;
}

export interface TaskEdge {
  id: string;
  source: string;
  target: string;
}

export interface TaskSegment {
  id: string;
  type: 'CPU' | 'GPU' | 'Datacopy' | 'FPGA';
  executionTime: number;
  affinity: 'CPU' | 'GPU' | 'DATACOPY' | 'FPGA';
}

// Combined simulation configuration
export interface SimulationConfig {
  hardware: HardwareConfig;
  taskset: TasksetConfig;
}

// Simulation progress types
export interface SimulationProgress {
  progress: number;
  currentSlice: number;
  totalSlices: number;
  status: string;
  logs: string[];
}

// Simulation result types
export interface DeadlineMiss {
  taskId: number;
  deadline: number;
  responseTime: number;
}

export interface ResourceUtilization {
  [key: string]: number; // Processor type -> utilization percentage
}

// Task response time statistics
export interface TaskResponseStats {
  taskId: number;
  count: number;
  mean: number;
  stdDev: number;
  q1: number;
  median: number;
  q3: number;
  min: number;
  max: number;
  range: number;
}

// Processor timeline event
export interface ProcessorTimelineEvent {
  processorId: number;
  timeSlot: number;
  taskId: number;
  segmentId: number;
}

// Simulation result types
export interface SimulationResult {
  hasDeadlineMiss: boolean;
  deadlineMisses: DeadlineMiss[];
  averageResponseTime: number;
  worstResponseTime: number;
  utilization: ResourceUtilization;
  taskResponseStats: TaskResponseStats[];
  processorTimeline: ProcessorTimelineEvent[][]; // [processorId][timeSlot]
  trace: any[];
  isSchedulable: boolean;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}