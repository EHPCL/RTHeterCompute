export default {
  nav: {
    home: 'Home',
    tryTool: 'Try the tool',
    blog: 'Blog',
    examples: 'Papers',
    demoVideos: 'Demo Videos',
    github: 'GitHub'
  },
  home: {
    title: 'RTComputeSimulator',
    subtitle: 'Optimize the Real-Time Tasks on the Heterogeneous CPU GPU DPFA Platforms',
    tryTool: 'Try the tool',
    introduction: 'Introduction',
    about: {
      title: 'About RTComputeSimulator',
      description: 'RTComputeSimulator is a state-of-the-art real-time computing system simulator designed to help researchers and engineers analyze, optimize, and validate system performance under various scenarios. Our simulator provides comprehensive support for multiple processor architectures and task models, enabling users to explore the full potential of computing systems.'
    },
    features: {
      title: 'Key Features',
      processorModels: {
        title: 'Processor Models',
        description: 'Support for CPU, GPU, DATACOPY, FPGA models'
      },
      taskModels: {
        title: 'Task Models',
        description: 'DAG and Suspension task models'
      },
      rlSupport: {
        title: 'RL Support',
        description: 'Reinforcement Learning scheduling algorithms'
      },
      sliceTickModel: {
        title: 'Slice/Tick Model',
        description: 'Detailed simulation with slice/tick granularity'
      }
    },
    howItWorks: {
      title: 'How it works',
      steps: {
        configureHardware: {
          title: 'Configure Hardware',
          description: 'Select and configure various processor types (CPU, GPU, FPGA, etc.) and their parameters.'
        },
        defineTasks: {
          title: 'Define Tasks',
          description: 'Create task sets with different models (DAG or self-suspension) and customize their properties.'
        },
        runSimulation: {
          title: 'Run Simulation',
          description: 'Select the scheduling algorithm, start the simulation and monitor progress in real-time.'
        },
        analyzeResults: {
          title: 'Analyze Results',
          description: 'View detailed statistics, performance metrics, and download trace files for further analysis.'
        }
      }
    },
    contact: {
      title: 'Contact',
      description: 'For any inquiries or support, please reach out to us at:',
      email: 'RTHeterogeneousCompute@outlook.com'
    }
  },
  tryTool: {
    hardwareConfig: {
      title: 'Hardware Configuration',
      processorType: 'Processor Type',
      coreCount: 'Core Count',
      preemptionSupport: 'Preemption Support',
      addProcessor: 'Add Processor',
      removeProcessor: 'Remove'
    },
    tasksetConfig: {
      title: 'Task Configuration',
      taskCount: 'Number of Tasks',
      taskModel: 'Task Model',
      edgeDensity: 'Edge Density (for DAG)',
      periodDeadlineRule: 'Period-Deadline Rule',
      customDeadlineFactor: 'Deadline Factor (for Ti < Di)'
    },
    runControl: {
      startSimulation: 'Start Simulation',
      stopSimulation: 'Stop Simulation',
      status: {
        idle: 'Ready to start',
        running: 'Simulation running...',
        completed: 'Simulation completed',
        failed: 'Simulation failed'
      },
      logs: 'Simulation Logs',
      results: 'Simulation Results',
      hasDeadlineMiss: 'Deadline Misses:',
      averageResponseTime: 'Average Response Time:',
      worstResponseTime: 'Worst Response Time:',
      utilization: 'Resource Utilization:',
      downloadTrace: 'Download Trace'
    }
  },
  blog: {
    title: 'Blog',
    subtitle: 'Project updates and milestones',
    filter: {
      all: 'All'
    },
    milestones: {
      v1Release: {
        title: 'RTComputeSimulator v1.0 Release',
        description: 'First official release of RTComputeSimulator with core simulation capabilities for computing real-time systems.'
      },
      dagSupport: {
        title: 'DAG Task Support Added',
        description: 'Added support for Directed Acyclic Graph (DAG) task models, enabling more complex task dependency scenarios.'
      },
      webUiPrototype: {
        title: 'Web UI Prototype Launched',
        description: 'First web-based user interface prototype released, providing visual configuration and real-time simulation monitoring.'
      },
      selfSuspension: {
        title: 'Self-Suspension Task Model Implementation',
        description: 'Implemented support for self-suspension task models, a critical feature for modern real-time systems.'
      },
      projectInitiation: {
        title: 'Project Initiation',
        description: 'RTComputeSimulator project officially started with the goal of developing a comprehensive real-time computing system simulator.'
      }
    }
  },
  examples: {
    title: 'Papers',
    subtitle: 'Case studies from research papers',
    configuration: 'Simulation Configuration',
    results: 'Key Results',
    hardware: 'Hardware:',
    tasks: 'Tasks:',
    readPaper: 'Read Paper'
  },
  demoVideos: {
    title: 'Demo Videos',
    caseStudyTitle: 'Case Study: RL-driven Scheduling',
    videoTitle: 'Reinforcement Learning Scheduler Improves ViT and Language Model Task Scheduling',
    description1: 'This demonstration video shows how RTComputeSimulator uses reinforcement learning scheduling to optimize the deployment of computationally intensive tasks such as Vision Transformers (ViT) and Language Models.',
    description2: 'Through intelligent scheduling algorithms, the system can dynamically adjust task allocation strategies based on task characteristics and hardware resource status, significantly improving the overall performance and resource utilization of heterogeneous computing systems.',
    description3: 'The video includes visualizations of the actual scheduling process and performance comparison analyses under different scheduling strategies, helping you intuitively understand the advantages of the reinforcement learning scheduler.',
    browserNotSupport: 'Your browser does not support the video tag.'
  },
  common: {
    loading: 'Loading...',
    error: 'Error occurred',
    success: 'Operation successful',
    confirm: 'Confirm',
    cancel: 'Cancel',
    back: 'Back'
  }
}