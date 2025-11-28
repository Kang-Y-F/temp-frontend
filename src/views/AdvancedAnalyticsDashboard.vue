<template>
  <div class="advanced-dashboard">
    <!-- Header -->
    <header class="dashboard-header">
      <h1>设备健康度与数据关联性分析</h1>
      <div class="timestamp">数据更新: {{ currentTime }}</div>
    </header>

    <!-- Main Grid Layout -->
    <main class="dashboard-grid">
      <!-- Left Column -->
      <div class="grid-column">
        <!-- 1. 设备健康度总览 -->
        <div class="data-card">
          <div class="card-header">
            <i class="icon icon-health"></i>
            <h3>设备健康度总览</h3>
          </div>
          <div class="health-overview">
            <v-chart class="chart health-gauge" :option="healthGaugeOption" autoresize />
            <div class="health-stats">
              <div v-for="level in healthLevels" :key="level.name" class="stat-item">
                <span class="label" :style="{ color: level.color }">{{ level.name }}</span>
                <span class="value">{{ level.count }} 台</span>
                <div class="bar-container">
                  <div class="bar" :style="{ width: level.percentage + '%', backgroundColor: level.color }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- 2. 数据存储层级分布 -->
        <div class="data-card">
          <div class="card-header">
            <i class="icon icon-sankey"></i>
            <h3>数据存储层级分布</h3>
          </div>
          <v-chart class="chart sankey-chart" :option="sankeyOption" autoresize />
        </div>
      </div>

      <!-- Center Column -->
      <div class="grid-column-large">
        <!-- 3. 传感器数据关联性热力图 -->
        <div class="data-card full-height">
           <div class="card-header">
            <i class="icon icon-heatmap"></i>
            <h3>传感器数据关联性热力图</h3>
          </div>
          <v-chart class="chart heatmap-chart" :option="heatmapOption" autoresize />
        </div>
      </div>

      <!-- Right Column -->
      <div class="grid-column">
        <!-- 4. 关键设备多维状态 -->
        <div class="data-card">
           <div class="card-header">
            <i class="icon icon-radar"></i>
            <h3>关键设备多维状态 - {{ selectedDevice.sensorName }}</h3>
          </div>
          <v-chart class="chart radar-chart" :option="radarOption" autoresize />
        </div>
        <!-- 5. 温/湿/压数据分布 -->
        <div class="data-card">
           <div class="card-header">
            <i class="icon icon-boxplot"></i>
            <h3>温/湿/压数据分布</h3>
          </div>
          <v-chart class="chart boxplot-chart" :option="boxplotOption" autoresize />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import * as echarts from 'echarts/core'; 
import 'echarts/extension/dataTool';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { GaugeChart, SankeyChart, HeatmapChart, RadarChart, BoxplotChart, ScatterChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  VisualMapComponent,
  DatasetComponent,
  DataZoomComponent  // <--- 确保 DataZoomComponent 在这里！
} from 'echarts/components';
import VChart, { THEME_KEY } from 'vue-echarts';
import { provide } from 'vue';

// 按需引入 ECharts 组件
echarts.use([  // <--- 将 use 函数调用改为使用 echarts 对象
  // dataTool,
  CanvasRenderer,
  GaugeChart,
  SankeyChart,
  HeatmapChart,
  RadarChart,
  BoxplotChart,
  ScatterChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  VisualMapComponent,
  DatasetComponent,
  DataZoomComponent
]);

// 提供 ECharts 主题
provide(THEME_KEY, 'dark');

// --- 模拟数据 & 响应式状态 ---

const currentTime = ref(new Date().toLocaleTimeString('zh-CN'));
let timer;

const allDeviceData = ref([]);

// 选中的用于雷达图展示的关键设备
const selectedDevice = computed(() => {
    // 简单地选择第一个报警的设备或第一个设备作为关键设备
    return allDeviceData.value.find(d => d.alarmTriggered) || allDeviceData.value[0] || {};
});

// --- ECharts 配置 ---

// 1. 健康度仪表盘
const overallHealthScore = computed(() => {
    if (allDeviceData.value.length === 0) return 0;
    // 简单模拟计算：100分基准，每个报警扣10分，预测偏差超过2度扣5分
    let score = 100;
    allDeviceData.value.forEach(d => {
        if (d.alarmTriggered) score -= 10;
        if (Math.abs(d.temperature - d.predictedTemperature) > 2) score -= 5;
    });
    return Math.max(0, Math.round(score / allDeviceData.value.length * 10)); // 缩放到0-100
});

const healthGaugeOption = computed(() => ({
  series: [
    {
      type: 'gauge',
      startAngle: 180,
      endAngle: 0,
      min: 0,
      max: 100,
      splitNumber: 5,
      axisLine: {
        lineStyle: {
          width: 12,
          color: [
            [0.4, '#ff4d4f'],
            [0.7, '#faad14'],
            [1, '#52c41a'],
          ],
        },
      },
      pointer: {
        icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
        length: '60%',
        width: 10,
        offsetCenter: [0, '-50%'],
        itemStyle: { color: 'auto' }
      },
      axisTick: { show: false },
      splitLine: {
        length: 15,
        lineStyle: { color: 'auto', width: 2 },
      },
      axisLabel: {
        color: '#fff',
        fontSize: 12,
        distance: -50,
      },
      detail: {
        valueAnimation: true,
        fontSize: 24,
        fontWeight: 'bold',
        offsetCenter: [0, '-15%'],
        formatter: '{value}',
        color: 'auto',
      },
      data: [{ value: overallHealthScore.value, name: '健康分' }],
      title: {
          offsetCenter: [0, '20%'],
          fontSize: 14,
          color: '#ccc'
      }
    },
  ],
}));

// 健康度等级统计
const healthLevels = computed(() => {
    const counts = { '优': 0, '良': 0, '中': 0, '差': 0 };
    allDeviceData.value.forEach(d => {
        let score = 100;
        if (d.alarmTriggered) score -= 40;
        if (Math.abs(d.temperature - d.predictedTemperature) > 2) score -= 20;
        if (score >= 90) counts['优']++;
        else if (score >= 70) counts['良']++;
        else if (score >= 50) counts['中']++;
        else counts['差']++;
    });
    const total = allDeviceData.value.length || 1;
    return [
        { name: '优', count: counts['优'], percentage: (counts['优']/total)*100, color: '#52c41a' },
        { name: '良', count: counts['良'], percentage: (counts['良']/total)*100, color: '#1890ff' },
        { name: '中', count: counts['中'], percentage: (counts['中']/total)*100, color: '#faad14' },
        { name: '差', count: counts['差'], percentage: (counts['差']/total)*100, color: '#ff4d4f' },
    ];
});

// 2. 桑基图
const sankeyOption = computed(() => {
    const nodes = [];
    const links = [];
    const nodeSet = new Set();
    
    allDeviceData.value.forEach(d => {
        const sourceName = d.sensorName || d.sensorId;
        const targetName = `存储层级: ${d.storageLevel}`;
        
        if (!nodeSet.has(sourceName)) {
            nodes.push({ name: sourceName });
            nodeSet.add(sourceName);
        }
        if (!nodeSet.has(targetName)) {
            nodes.push({ name: targetName });
            nodeSet.add(targetName);
        }

        const existingLink = links.find(l => l.source === sourceName && l.target === targetName);
        if (existingLink) {
            existingLink.value++;
        } else {
            links.push({ source: sourceName, target: targetName, value: 1 });
        }
    });

    return {
        tooltip: { trigger: 'item', triggerOn: 'mousemove' },
        series: {
            type: 'sankey',
            data: nodes,
            links: links,
            emphasis: { focus: 'adjacency' },
            lineStyle: { color: 'gradient', curveness: 0.5 },
            label: { color: '#fff', fontSize: 10 }
        }
    };
});

// 3. 热力图
const heatmapOption = computed(() => {
    // 这是一个简化的模拟，真实场景需要多组时间序列数据来计算相关系数矩阵
    const sensors = allDeviceData.value.map(d => d.sensorName);
    const data = [];
    // 模拟一个相关性矩阵
    for (let i = 0; i < sensors.length; i++) {
        for (let j = 0; j < sensors.length; j++) {
            let correlation;
            if (i === j) {
                correlation = 1; // 自身相关性为1
            } else {
                // 模拟一个随机的相关性值
                correlation = parseFloat(Math.random().toFixed(2));
            }
            data.push([i, j, correlation]);
        }
    }
    
    return {
        tooltip: {
            position: 'top',
            formatter: params => {
                const xName = sensors[params.data[0]];
                const yName = sensors[params.data[1]];
                return `${xName} & ${yName}<br/>相关性: ${params.data[2]}`;
            }
        },
        grid: { height: '80%', top: '10%', left: '25%', right: '5%' },
        xAxis: { type: 'category', data: sensors, splitArea: { show: true }, axisLabel: { rotate: 45, color: '#ccc' } },
        yAxis: { type: 'category', data: sensors, axisLabel: { color: '#ccc' } },
        visualMap: {
            min: 0,
            max: 1,
            calculable: true,
            orient: 'horizontal',
            left: 'center',
            bottom: '0%',
            inRange: { color: ['#313695', '#4575b4', '#fee090', '#f46d43', '#a50026'] },
            textStyle: { color: '#fff'}
        },
        series: [{
            name: '温度相关性',
            type: 'heatmap',
            data: data,
            label: { show: sensors.length < 10, color: '#fff' }, // 数据点不多时显示数值
            emphasis: {
                itemStyle: { shadowBlur: 10, shadowColor: 'rgba(255, 255, 255, 0.5)' }
            }
        }]
    };
});

// 4. 雷达图
const radarOption = computed(() => {
    const device = selectedDevice.value;
    if (!device.sensorId) return {};

    // 标准化数据，使其在雷达图上尺度一致
    const normalize = (val, min, max) => Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100));

    const indicators = [
        { name: '温度', max: 50 }, // 假设温度范围0-50
        { name: '湿度', max: 100 },
        { name: '压力', max: 1100 }, // 假设压力范围900-1100
        { name: '预测偏差', max: 10 }, // 偏差范围0-10
        { name: '报警风险', max: 100 }
    ];

    const values = [
        device.temperature || 0,
        device.humidity || 0,
        device.pressure || 0,
        Math.abs((device.temperature || 0) - (device.predictedTemperature || 0)),
        device.alarmTriggered ? 95 : 20 // 报警则风险高，否则低
    ];
    
    return {
        radar: {
            indicator: indicators,
            shape: 'circle',
            axisName: { color: '#ccc' },
            splitArea: { areaStyle: { color: ['rgba(37, 51, 100, 0.5)', 'rgba(22, 33, 70, 0.5)'] } },
            axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.2)' } },
            splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.2)' } }
        },
        tooltip: {},
        series: [{
            type: 'radar',
            data: [{
                value: values,
                name: device.sensorName,
                areaStyle: { color: 'rgba(0, 221, 255, 0.4)' },
                lineStyle: { color: 'rgba(0, 221, 255, 1)' },
                itemStyle: { color: 'rgba(0, 221, 255, 1)' }
            }]
        }]
    };
});

// 5. 箱形图
const boxplotOption = computed(() => {
    // 1. 手动准备数据，这是修复问题的关键
    // 我们需要将原始数据处理成 ECharts 箱形图需要识别的格式
    const data = echarts.dataTool.prepareBoxplotData([
        allDeviceData.value.map(d => d.temperature),
        allDeviceData.value.map(d => d.humidity),
        allDeviceData.value.map(d => d.pressure)
    ]);
    /*
        上面的代码会生成类似这样的结构：
        {
            boxData: [
                [min, q1, median, q3, max], // 温度的箱形数据
                [min, q1, median, q3, max], // 湿度的箱形数据
                [min, q1, median, q3, max]  // 压力的箱形数据
            ],
            outliers: [
                [categoryIndex, value], // 离群点1
                [categoryIndex, value]  // 离群点2
            ]
        }
    */

    return {
        tooltip: { 
            trigger: 'item', 
            axisPointer: { type: 'shadow' } 
        },
        grid: { left: '10%', right: '10%', bottom: '15%' },
        xAxis: {
            type: 'category',
            data: data.axisData, // 使用 dataTool 生成的轴数据，通常是 ['1', '2', '3']
            axisLabel: { 
                color: '#ccc',
                // 将轴标签从数字映射回有意义的名称
                formatter: function (value, index) {
                    return ['温度', '湿度', '压力'][index];
                }
            },
            axisLine: { lineStyle: { color: '#555' } }
        },
        yAxis: {
            type: 'value',
            name: '数值',
            nameTextStyle: { color: '#ccc' },
            axisLabel: { color: '#ccc' },
            splitLine: { lineStyle: { color: '#333' } }
        },
        series: [{
            name: '数据分布',
            type: 'boxplot',
            data: data.boxData, // 使用 dataTool 计算好的箱形数据
            itemStyle: {
                color: '#1890ff',
                borderColor: '#73c0de'
            }
        }, {
            name: '离群点',
            type: 'scatter',
            data: data.outliers, // 使用 dataTool 计算好的离群点数据
            symbolSize: 8,
            itemStyle: { color: '#ff4d4f' }
        }]
    };
});



// --- 数据模拟 & 生命周期 ---

const generateMockData = () => {
  const deviceCount = 10;
  const newData = [];
  const storageLevels = ['REALTIME', 'HOURLY_AVG', 'DAILY_AVG'];

  for (let i = 1; i <= deviceCount; i++) {
    const deviceId = `jetson-${String(i).padStart(3, '0')}`;
    const sensorId = `cold-room-${String(i).padStart(2, '0')}`;
    const sensorName = `冷藏库${i}号`;
    const temp = parseFloat((Math.random() * 20 + 15).toFixed(1)); // 15-35
    const predTemp = parseFloat((temp + (Math.random() - 0.5) * 4).toFixed(1));
    const alarm = temp > 30;

    newData.push({
      id: null,
      deviceId: deviceId,
      sensorId: sensorId,
      sensorName: sensorName,
      timestamp: new Date().toISOString(),
      temperature: temp,
      humidity: parseFloat((Math.random() * 40 + 40).toFixed(1)), // 40-80
      pressure: parseFloat((Math.random() * 100 + 980).toFixed(1)), // 980-1080
      predictedTemperature: predTemp,
      alarmTriggered: alarm,
      alarmMessage: alarm ? `传感器 [${sensorName} (${sensorId})] 温度过高: ${temp}°C (阈值: 30.0°C)` : null,
      isUploaded: true,
      storageLevel: storageLevels[Math.floor(Math.random() * storageLevels.length)],
    });
  }
  allDeviceData.value = newData;
  console.log('Generated mock data:', allDeviceData.value);
};

onMounted(() => {
  generateMockData(); // 初始加载
  timer = setInterval(() => {
    currentTime.value = new Date().toLocaleTimeString('zh-CN');
    generateMockData(); // 每10秒更新一次数据
  }, 10000);
});

onUnmounted(() => {
  clearInterval(timer);
});
</script>

<style scoped>
/* 基本样式和深色主题 */
.advanced-dashboard {
  font-family: 'Helvetica Neue', Arial, sans-serif;
  background-color: #0f172a; /* 深蓝背景 */
  color: #e2e8f0;
  padding: 20px;
  height: 100vh;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

/* 头部 */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 0 10px;
}

.dashboard-header h1 {
  font-size: 28px;
  font-weight: bold;
  color: #64b5f6; /* 亮蓝色标题 */
  text-shadow: 0 0 10px #64b5f6;
  margin: 0;
}

.timestamp {
  font-size: 16px;
  color: #94a3b8;
}

/* 网格布局 */
.dashboard-grid {
  flex-grow: 1;
  display: grid;
  grid-template-columns: 1fr 1.5fr 1fr; /* 三列布局，中间宽 */
  grid-template-rows: 1fr;
  gap: 20px;
}

.grid-column, .grid-column-large {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.grid-column-large .data-card {
  flex-grow: 1;
}

/* 数据卡片样式 */
.data-card {
  background: rgba(19, 29, 51, 0.6); /* 半透明卡片背景 */
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
}

.data-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 150, 255, 0.3);
  border-color: #4f6a91;
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  border-bottom: 1px solid #334155;
  padding-bottom: 10px;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  color: #cbd5e1;
  font-weight: 500;
}

.card-header .icon {
  margin-right: 10px;
  font-size: 20px; /* 伪元素图标 */
  color: #64b5f6;
}

/* 伪元素图标 - 简单示例 */
.icon-health::before { content: '❤️'; }
.icon-sankey::before { content: '🌊'; }
.icon-heatmap::before { content: '🔥'; }
.icon-radar::before { content: '🎯'; }
.icon-boxplot::before { content: '📊'; }


/* 图表容器 */
.chart {
  width: 100%;
  flex-grow: 1;
  min-height: 200px; /* 保证最小高度 */
}

/* 特定模块的微调 */
.health-overview {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-grow: 1;
}
.health-gauge {
  flex-basis: 50%;
}
.health-stats {
  flex-basis: 50%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.stat-item {
  display: flex;
  align-items: center;
  font-size: 14px;
}
.stat-item .label {
  width: 30px;
  font-weight: bold;
}
.stat-item .value {
  width: 60px;
  color: #cbd5e1;
}
.bar-container {
  flex-grow: 1;
  height: 10px;
  background-color: #334155;
  border-radius: 5px;
  overflow: hidden;
}
.bar {
  height: 100%;
  border-radius: 5px;
  transition: width 0.5s ease-out;
}

.full-height {
  height: 100%; /* 让热力图占满父容器高度 */
}

.heatmap-chart, .sankey-chart, .radar-chart, .boxplot-chart {
  height: calc(100% - 50px); /* 减去头高度 */
}
</style>
