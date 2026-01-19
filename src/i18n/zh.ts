export default {
  nav: {
    home: '首页',
    tryTool: '体验工具',
    blog: '博客',
    examples: '示例论文',
    demoVideos: '演示视频',
    github: 'GitHub'
  },
  home: {
    title: 'RTComputeSimulator',
    subtitle: '优化异构 CPU GPU FPGA 平台上的实时任务',
    tryTool: '体验工具',
    introduction: '简介',
    about: {
      title: '关于 RTComputeSimulator',
      description: 'RTComputeSimulator 是一款先进的实时计算系统模拟器，旨在帮助研究人员和工程师分析、优化和验证各种场景下的系统性能。我们的模拟器提供对多种处理器架构和任务模型的全面支持，使用户能够探索计算系统的全部潜力。'
    },
    features: {
      title: '核心功能',
      processorModels: {
        title: '处理器模型',
        description: '支持 CPU、GPU、DATACOPY、FPGA 模型'
      },
      taskModels: {
        title: '任务模型',
        description: 'DAG 和自挂起任务模型'
      },
      rlSupport: {
        title: '强化学习支持',
        description: '强化学习调度算法'
      },
      sliceTickModel: {
        title: '时间片/时钟模型',
        description: '具有时间片/时钟粒度的详细仿真'
      }
    },
    howItWorks: {
      title: '工作原理',
      steps: {
        configureHardware: {
          title: '配置硬件',
          description: '选择并配置各种处理器类型（CPU、GPU、FPGA 等）及其参数。'
        },
        defineTasks: {
          title: '定义任务',
          description: '创建具有不同模型（DAG 或自挂起）的任务集并自定义其属性。'
        },
        runSimulation: {
          title: '运行仿真',
          description: '选择调度算法，开始仿真并实时监控进度。'
        },
        analyzeResults: {
          title: '分析结果',
          description: '查看详细统计数据、性能指标并下载跟踪文件以进行进一步分析。'
        }
      }
    },
    contact: {
      title: '联系我们',
      description: '如有任何疑问或支持需求，请通过以下方式联系我们：',
      email: 'RTHeterogeneousCompute@outlook.com'
    }
  },
  tryTool: {
    hardwareConfig: {
      title: '硬件配置',
      processorType: '处理器类型',
      coreCount: '核心数量',
      preemptionSupport: '抢占支持',
      addProcessor: '添加处理器',
      removeProcessor: '移除'
    },
    tasksetConfig: {
      title: '任务配置',
      taskCount: '任务数量',
      taskModel: '任务模型',
      edgeDensity: '边密度（DAG专用）',
      periodDeadlineRule: '周期-截止时间规则',
      customDeadlineFactor: '截止时间因子（Ti < Di 时）'
    },
    runControl: {
      startSimulation: '开始仿真',
      stopSimulation: '停止仿真',
      status: {
        idle: '准备开始',
        running: '仿真运行中...',
        completed: '仿真完成',
        failed: '仿真失败'
      },
      logs: '仿真日志',
      results: '仿真结果',
      hasDeadlineMiss: '截止时间错过:',
      averageResponseTime: '平均响应时间:',
      worstResponseTime: '最坏响应时间:',
      utilization: '资源利用率:',
      downloadTrace: '下载跟踪数据'
    }
  },
  blog: {
    title: '博客',
    subtitle: '项目更新和里程碑',
    filter: {
      all: '全部'
    },
    milestones: {
      v1Release: {
        title: 'RTComputeSimulator v1.0 发布',
        description: 'RTComputeSimulator 第一个正式版本发布，具备计算实时系统的核心仿真能力。'
      },
      dagSupport: {
        title: '添加 DAG 任务支持',
        description: '添加了有向无环图（DAG）任务模型支持，实现了更复杂的任务依赖场景。'
      },
      webUiPrototype: {
        title: 'Web UI 原型发布',
        description: '发布了第一个基于 Web 的用户界面原型，提供可视化配置和实时仿真监控。'
      },
      selfSuspension: {
        title: '实现自挂起任务模型',
        description: '实现了自挂起任务模型支持，这是现代实时系统的关键特性。'
      },
      projectInitiation: {
        title: '项目启动',
        description: 'RTComputeSimulator 项目正式启动，目标是开发一个全面的实时计算系统模拟器。'
      }
    }
  },
  examples: {
    title: '示例论文',
    subtitle: '研究论文中的案例研究',
    configuration: '仿真配置',
    results: '关键结果',
    hardware: '硬件:',
    tasks: '任务:',
    readPaper: '阅读论文'
  },
  demoVideos: {
    title: '演示视频',
    caseStudyTitle: '案例研究：强化学习驱动的调度',
    videoTitle: '强化学习调度器改进视觉Transformer和语言模型任务调度',
    description1: '本演示视频展示了RTComputeSimulator如何使用强化学习调度来优化计算密集型任务（如视觉Transformer和语言模型）的部署。',
    description2: '通过智能调度算法，系统可以根据任务特性和硬件资源状态动态调整任务分配策略，显著提高异构计算系统的整体性能和资源利用率。',
    description3: '视频包括实际调度过程的可视化和不同调度策略下的性能比较分析，帮助您直观了解强化学习调度器的优势。',
    browserNotSupport: '您的浏览器不支持视频标签。'
  },
  common: {
    loading: '加载中...',
    error: '发生错误',
    success: '操作成功',
    confirm: '确认',
    cancel: '取消',
    back: '返回'
  }
}