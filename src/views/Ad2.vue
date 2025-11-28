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
       <div class="data-card" style="flex-grow: 0.9;">
         <div class="card-header">
           <i class="icon icon-health"></i>
           <h3>设备健康度总览</h3>
         </div>
         <div class="health-overview">
           <v-chart class="chart health-gauge" :option="healthGaugeOption" autoresize />
           <div class="health-stats">
             <!-- ... health-stats 内容 ... -->
           </div>
         </div>
       </div>
       <!-- 2. 数据存储层级分布 -->
       <div class="data-card" style="flex-grow: 1;">
         <div class="card-header">
           <i class="icon icon-sankey"></i>
           <h3>数据存储层级分布</h3>
         </div>
         <v-chart class="chart sankey-chart" :option="sankeyOption" autoresize />
       </div>
     </div>


      <!-- Center Column -->
      <div class="grid-column-large">
        <!-- 3. 传感器数据关联性热力图, 减小高度 -->
        <div class="data-card" style="flex-grow: 1.5;">
           <div class="card-header">
            <i class="icon icon-heatmap"></i>
            <h3>传感器数据关联性热力图</h3>
          </div>
          <v-chart class="chart heatmap-chart" :option="heatmapOption" autoresize />
        </div>
        <!-- 4. 新增: 报警事件根本原因分析 -->
        <div class="data-card" style="flex-grow: 1;">
          <div class="card-header">
            <i class="icon icon-alarm"></i>
            <h3>近期报警事件分析</h3>
          </div>
          <ul class="alarm-list">
            <li v-for="alarm in latestAlarms" :key="alarm.sensorId">
              <div class="alarm-title">
                <span class="sensor-name">{{ alarm.sensorName }}</span>
                <span class="time">{{ new Date(alarm.timestamp).toLocaleTimeString() }}</span>
              </div>
              <div class="alarm-message">{{ alarm.alarmMessage }}</div>
            </li>
            <li v-if="latestAlarms.length === 0" class="no-alarms">
              系统状态正常，无报警事件
            </li>
          </ul>
        </div>
      </div>

      <!-- Right Column -->
      <div class="grid-column">
        <!-- 5. 关键设备多维状态雷达图 -->
        <div class="data-card">
           <div class="card-header">
            <i class="icon icon-radar"></i>
            <h3>关键设备多维状态 - {{ selectedDevice.sensorName }}</h3>
          </div>
          <v-chart class="chart radar-chart" :option="radarOption" autoresize />
        </div>
        <!-- 6. 拆分后的三个箱形图 -->
        <div class="data-card small-chart-card">
           <div class="card-header">
            <i class="icon icon-boxplot"></i>
            <h3>温度分布 (°C)</h3>
          </div>
          <v-chart class="chart boxplot-chart" :option="temperatureBoxplotOption" autoresize />
        </div>
         <div class="data-card small-chart-card">
           <div class="card-header">
            <i class="icon icon-boxplot"></i>
            <h3>湿度分布 (%)</h3>
          </div>
          <v-chart class="chart boxplot-chart" :option="humidityBoxplotOption" autoresize />
        </div>
         <div class="data-card small-chart-card">
           <div class="card-header">
            <i class="icon icon-boxplot"></i>
            <h3>压力分布 (hPa)</h3>
          </div>
          <v-chart class="chart boxplot-chart" :option="pressureBoxplotOption" autoresize />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { provide } from 'vue';
import VChart, { THEME_KEY } from 'vue-echarts';

// --- ECharts 按需引入 ---
import * as echarts from 'echarts/core';
import 'echarts/extension/dataTool'; // 引入数据处理工具

import { CanvasRenderer } from 'echarts/renderers';

// 引入图表类型
import {
  GaugeChart,
  SankeyChart,
  HeatmapChart,
  RadarChart,
  BoxplotChart,
  ScatterChart,
} from 'echarts/charts';

// 引入组件
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  VisualMapComponent,
  DatasetComponent,
} from 'echarts/components';

// 注册所有引入的模块
echarts.use([
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
]);

// 提供 ECharts 主题
provide(THEME_KEY, 'dark');

// --- 模拟数据 & 响应式状态 ---

const currentTime = ref(new Date().toLocaleTimeString('zh-CN'));
let timer;
const allDeviceData = ref([]);

// 选中的用于雷达图展示的关键设备
const selectedDevice = computed(() => {
    return allDeviceData.value.find(d => d.alarmTriggered) || allDeviceData.value[0] || {};
});

// --- ECharts 配置 ---

// 1. 健康度仪表盘
const overallHealthScore = computed(() => {
    if (allDeviceData.value.length === 0) return 0;
    let score = 100 * allDeviceData.value.length;
    allDeviceData.value.forEach(d => {
        if (d.alarmTriggered) score -= 10;
        if (Math.abs(d.temperature - d.predictedTemperature) > 2) score -= 5;
    });
    return Math.max(0, Math.round(score / (allDeviceData.value.length || 1) ));
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
        else if (score >= 80) counts['良']++;
        else if (score >= 60) counts['中']++;
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
    const sensors = allDeviceData.value.map(d => d.sensorName);
    const data = [];
    for (let i = 0; i < sensors.length; i++) {
        for (let j = 0; j < sensors.length; j++) {
            data.push([i, j, i === j ? 1 : parseFloat(Math.random().toFixed(2))]);
        }
    }
    return {
        tooltip: {
            position: 'top',
            formatter: params => `${sensors[params.data[0]]} & ${sensors[params.data[1]]}<br/>相关性: ${params.data[2]}`
        },
        grid: { height: '70%', top: '10%', left: '20%', right: '5%' },
        xAxis: { type: 'category', data: sensors, splitArea: { show: true }, axisLabel: { rotate: 30, color: '#ccc', fontSize: 10 } },
        yAxis: { type: 'category', data: sensors, axisLabel: { color: '#ccc', fontSize: 10 } },
        visualMap: {
            min: 0, max: 1, calculable: true, orient: 'horizontal', left: 'center', bottom: '0%',
            inRange: { color: ['#313695', '#4575b4', '#fee090', '#f46d43', '#a50026'] },
            textStyle: { color: '#fff'}
        },
        series: [{
            name: '温度相关性', type: 'heatmap', data: data,
            label: { show: sensors.length < 12, color: '#fff', fontSize: 10 },
            emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(255, 255, 255, 0.5)' } }
        }]
    };
});

// 4. 报警列表
const latestAlarms = computed(() => {
    return allDeviceData.value
        .filter(d => d.alarmTriggered)
        .slice(0, 5); // 最多显示5条
});

// 5. 雷达图
const radarOption = computed(() => {
    const device = selectedDevice.value;
    if (!device.sensorId) return {};
    const indicators = [
        { name: '温度', max: 50 }, { name: '湿度', max: 100 }, { name: '压力', max: 1100 },
        { name: '预测偏差', max: 10 }, { name: '报警风险', max: 100 }
    ];
    const values = [
        device.temperature || 0, device.humidity || 0, device.pressure || 0,
        Math.abs((device.temperature || 0) - (device.predictedTemperature || 0)),
        device.alarmTriggered ? 95 : 20
    ];
    return {
        radar: {
            indicator: indicators, shape: 'circle',
            axisName: { color: '#ccc', fontSize: 12 },
            splitArea: { areaStyle: { color: ['rgba(37, 51, 100, 0.5)', 'rgba(22, 33, 70, 0.5)'] } },
            axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.2)' } },
            splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.2)' } }
        },
        tooltip: { trigger: 'item' },
        series: [{
            type: 'radar',
            data: [{
                value: values, name: device.sensorName,
                areaStyle: { color: 'rgba(0, 221, 255, 0.4)' },
                lineStyle: { color: 'rgba(0, 221, 255, 1)' },
                itemStyle: { color: 'rgba(0, 221, 255, 1)' }
            }]
        }]
    };
});

// 6. 箱形图
const createBoxplotOption = (dataArray, axisName, color) => {
    if (!dataArray || dataArray.length === 0) {
        return { title: { text: '无数据', left: 'center', top: 'center', textStyle: {color: '#888'} } };
    }
    const data = echarts.dataTool.prepareBoxplotData([dataArray]);
    return {
        tooltip: { trigger: 'item', axisPointer: { type: 'shadow' } },
        grid: { left: '20%', right: '10%', top: '10%', bottom: '20%' },
		xAxis: {
			type: 'category', // 明确指定轴类型为类目轴
			data: [''],       // 提供一个匿名的类目，这是关键！
			show: false       // 仍然不显示它
		},
        yAxis: {
            type: 'value', name: axisName,
            nameTextStyle: { color: '#ccc', fontSize: 10, padding: [0, 0, 0, 30] },
            axisLabel: { color: '#ccc', fontSize: 10 },
            splitLine: { lineStyle: { color: '#333' } },
        },
        series: [{
            name: '分布', type: 'boxplot', data: data.boxData,
            itemStyle: { color: color.bg, borderColor: color.border },
        }, {
            name: '离群点', type: 'scatter', data: data.outliers,
            symbolSize: 8, itemStyle: { color: '#ff4d4f' },
        }],
    };
};

const temperatureBoxplotOption = computed(() => createBoxplotOption(allDeviceData.value.map(d => d.temperature), '°C', { bg: '#5470c6', border: '#91cc75' }));
const humidityBoxplotOption = computed(() => createBoxplotOption(allDeviceData.value.map(d => d.humidity), '%', { bg: '#91cc75', border: '#fac858' }));
const pressureBoxplotOption = computed(() => createBoxplotOption(allDeviceData.value.map(d => d.pressure), 'hPa', { bg: '#fac858', border: '#ee6666' }));

// --- 数据模拟 & 生命周期 ---
const generateMockData = () => {
  const deviceCount = 10;
  const newData = [];
  const storageLevels = ['REALTIME', 'HOURLY_AVG', 'DAILY_AVG'];
  for (let i = 1; i <= deviceCount; i++) {
    const temp = parseFloat((Math.random() * 20 + 15).toFixed(1));
    const predTemp = parseFloat((temp + (Math.random() - 0.5) * 4).toFixed(1));
    const alarm = temp > 30;
    newData.push({
      id: null,
      deviceId: `jetson-${String(i).padStart(3, '0')}`,
      sensorId: `cold-room-${String(i).padStart(2, '0')}`,
      sensorName: `冷藏库${i}号`,
      timestamp: new Date().toISOString(),
      temperature: temp,
      humidity: parseFloat((Math.random() * 40 + 40).toFixed(1)),
      pressure: parseFloat((Math.random() * 100 + 980).toFixed(1)),
      predictedTemperature: predTemp,
      alarmTriggered: alarm,
      alarmMessage: alarm ? `温度过高: ${temp}°C (阈值: 30.0°C)` : null,
      storageLevel: storageLevels[Math.floor(Math.random() * storageLevels.length)],
    });
  }
  allDeviceData.value = newData;
};

onMounted(() => {
  generateMockData();
  timer = setInterval(() => {
    currentTime.value = new Date().toLocaleTimeString('zh-CN');
    generateMockData();
  }, 10000);
});

onUnmounted(() => {
  clearInterval(timer);
});
</script>

<style scoped>
.advanced-dashboard {
  font-family: 'Helvetica Neue', Arial, sans-serif;
  background-color: #0f172a;
  color: #e2e8f0;
  padding: 20px;
  height: 100vh;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

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
  color: #64b5f6;
  text-shadow: 0 0 10px #64b5f6;
  margin: 0;
}

.timestamp { font-size: 16px; color: #94a3b8; }

.dashboard-grid {
  flex-grow: 1;
  display: grid;
  grid-template-columns: 1fr 1.5fr 1fr;
  grid-template-rows: minmax(0, 1fr);
  gap: 20px;
}

.grid-column, .grid-column-large {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.data-card {
  background: rgba(19, 29, 51, 0.6);
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

.card-header h3 { margin: 0; font-size: 18px; color: #cbd5e1; font-weight: 500; }
.card-header .icon { margin-right: 10px; font-size: 20px; color: #64b5f6; }

.icon-health::before { content: '❤️'; }
.icon-sankey::before { content: '🌊'; }
.icon-heatmap::before { content: '🔥'; }
.icon-radar::before { content: '🎯'; }
.icon-boxplot::before { content: '📊'; }
.icon-alarm::before { content: '🔔'; }

.chart { width: 100%; flex-grow: 1; min-height: 100px; }

.health-overview { display: flex; align-items: center; gap: 15px; flex-grow: 1; }
.health-gauge {
  /* 修改：明确设置宽度为50%，而不是依赖flex-basis */
  width: 50%;
  /* 新增：确保它不会被压缩 */
  flex-shrink: 0;
}
.health-stats {
  /* 修改：明确设置宽度为50% */
  width: 50%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.stat-item { display: flex; align-items: center; font-size: 14px; }
.stat-item .label { width: 30px; font-weight: bold; }
.stat-item .value { width: 60px; color: #cbd5e1; }
.bar-container { flex-grow: 1; height: 10px; background-color: #334155; border-radius: 5px; overflow: hidden; }
.bar { height: 100%; border-radius: 5px; transition: width 0.5s ease-out; }

.small-chart-card { flex-grow: 1; min-height: 150px; }
.small-chart-card .chart { min-height: 100px; }

.alarm-list {
  list-style: none; padding: 0; margin: 0; height: 100%;
  overflow-y: auto; display: flex; flex-direction: column; gap: 15px;
}
.alarm-list::-webkit-scrollbar { width: 4px; }
.alarm-list::-webkit-scrollbar-thumb { background: #4f6a91; border-radius: 2px; }
.alarm-list li {
  background: rgba(255, 77, 79, 0.1); border-left: 3px solid #ff4d4f;
  padding: 8px 12px; border-radius: 4px;
}
.alarm-list .alarm-title { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
.alarm-list .sensor-name { font-weight: bold; color: #f1f5f9; }
.alarm-list .time { font-size: 12px; color: #94a3b8; }
.alarm-list .alarm-message { font-size: 14px; color: #cbd5e1; word-break: break-all; }
.alarm-list .no-alarms {
  background: none; border: none; display: flex; align-items: center; justify-content: center;
  flex-grow: 1; color: #64748b; font-size: 16px;
}
</style>
