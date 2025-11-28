<template>
  <div class="advanced-dashboard">
    <!-- Header -->
    <header class="dashboard-header">
      <h1>设备健康度与数据关联性分析</h1>
      <div class="timestamp">数据更新: {{ currentTime }}</div>
    </header>

    <!-- Main Grid Layout (已按新布局调整) -->
    <main class="dashboard-grid">
     <!-- Left Column -->
     <div class="grid-column">
       <!-- 1. 设备健康度总览 -->
       <div class="data-card5" style="flex-grow: 0.8;">
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
       <!-- 2. 数据存储层级分布 (桑基图) -->
       <div class="data-card3" style="flex-grow: 1.5;">
         <div class="card-header">
           <i class="icon icon-sankey"></i>
           <h3>数据存储层级分布</h3>
         </div>
         <v-chart class="chart sankey-chart" :option="sankeyOption" autoresize />
       </div>
       <!-- 3. 设备数据上传状态 (从右侧移来) -->
       <div class="data-card4" style="flex-grow: 1;">
          <div class="card-header">
            <i class="icon icon-storage"></i>
            <h3>设备数据上传状态</h3>
          </div>
          <v-chart class="chart donut-chart" :option="storageLevelDistributionOption" autoresize />
        </div>
     </div>

      <!-- Center Column (保持不变) -->
      <div class="grid-column-large">
        <div class="data-card2 center-card-special-margin" style="flex-grow: 1.5;">
           <div class="card-header">
            <i class="icon icon-heatmap"></i>
            <h3>传感器数据关联性热力图</h3>
          </div>
          <v-chart class="chart heatmap-chart" :option="heatmapOption" autoresize />
        </div>
        <div class="data-card2 center-card-special-margin" style="flex-grow: 1;">
          <div class="card-header">
            <i class="icon icon-scatter"></i>
            <h3>多维数据探索</h3>
            <div class="dim-selector">
              <span>X轴:</span>
              <select v-model="scatterXAxisDim">
                <option v-for="dim in availableDims" :key="dim.value" :value="dim.value">{{ dim.name }}</option>
              </select>
              <span>Y轴:</span>
              <select v-model="scatterYAxisDim">
                <option v-for="dim in availableDims" :key="dim.value" :value="dim.value">{{ dim.name }}</option>
              </select>
              <span>大小:</span>
              <select v-model="scatterSizeDim">
                <option v-for="dim in availableDims" :key="dim.value" :value="dim.value">{{ dim.name }}</option>
              </select>
            </div>
          </div>
          <v-chart class="chart scatter-chart" :option="scatterOption" autoresize />
        </div>
      </div>

      <!-- Right Column (已按新布局调整) -->
      <div class="grid-column">
        <!-- 1. 关键设备多维状态 (雷达图) -->
        <div class="data-card3 center-card-special-margin4 " style="flex-grow: 0.1;">
           <div class="card-header">
            <i class="icon icon-radar"></i>
            <h3>关键设备多维状态 - {{ selectedDevice.sensorName }}</h3>
          </div>
          <v-chart class="chart radar-chart" :option="radarOption" autoresize />
        </div>
        <!-- 2. 实时数据极值分析 -->
        <div class="data-card extrema-card" style="flex-grow: 0.22;">
          <div class="card-header">
            <i class="icon icon-extrema"></i>
            <h3>实时数据极值分析</h3>
          </div>
          <div class="extrema-content">
            <div v-for="item in extremaData" :key="item.name" class="extrema-item">
              <span class="extrema-name">{{ item.name }}</span>
              <div class="extrema-values">
                <span class="value-max">MAX: {{ item.max.toFixed(1) }}</span>
                <span class="value-avg">
                  AVG: {{ item.avg.toFixed(1) }}
                  <span :class="['trend-arrow', item.trend]">{{ item.trend === 'up' ? '↑' : (item.trend === 'down' ? '↓' : '—') }}</span>
                </span>
                <span class="value-min">MIN: {{ item.min.toFixed(1) }}</span>
              </div>
            </div>
          </div>
        </div>
        <!-- 3. 故障关键词 (从左侧移来) -->
        <div class="data-card center-card-special-margin3 fault-keywords-card" style="flex-grow: 1; flex-basis: 0;">
          <div class="card-header">
            <i class="icon icon-keywords"></i>
            <h3>故障关键词</h3>
            <span class="subtitle-text">FAULT KEYWORDS</span>
          </div>
          <div class="fault-keywords-content">
            <!-- 左侧词云 -->
            <div class="wordcloud-container">
              <v-chart class="chart wordcloud-chart" :option="wordCloudOption" autoresize />
            </div>
            <!-- 右侧双列轮播列表 -->
            <div class="list-container">
              <div class="list-header">
                <span>排名</span><span>关键词</span><span>次数</span>
              </div>
				<!-- 修改为单列代码 -->
				<div class="single-list-wrapper">
				  <vue3-seamless-scroll :list="allFaultKeywords" class="seamless-scroll-wrapper" :step="0.5" :hover="true">
					<div class="list-item" v-for="item in allFaultKeywords" :key="item.name">
					  <span class="rank" :class="`rank-${item.rank}`">{{ item.rank }}</span>
					  <span class="name">{{ item.name }}</span>
					  <span class="value">{{ item.value }}</span>
					</div>
				  </vue3-seamless-scroll>
				</div>
            </div>
          </div>
       </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { provide } from 'vue';
import VChart, { THEME_KEY } from 'vue-echarts';
import { Vue3SeamlessScroll } from "vue3-seamless-scroll";
import 'echarts-wordcloud';

import * as echarts from 'echarts/core';
import 'echarts/extension/dataTool';
import { CanvasRenderer } from 'echarts/renderers';
import { GaugeChart, SankeyChart, HeatmapChart, RadarChart, ScatterChart, PieChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, GridComponent, LegendComponent, VisualMapComponent, DatasetComponent, DataZoomComponent, BrushComponent } from 'echarts/components';

echarts.use([
  CanvasRenderer, GaugeChart, SankeyChart, HeatmapChart, RadarChart, ScatterChart, PieChart,
  TitleComponent, TooltipComponent, GridComponent, LegendComponent, VisualMapComponent, DatasetComponent,
  DataZoomComponent, BrushComponent
]);

provide(THEME_KEY, 'dark');

const currentTime = ref(new Date().toLocaleTimeString('zh-CN'));
let timer;
const allDeviceData = ref([]);
const previousAvgData = ref({}); 
const selectedDevice = computed(() => allDeviceData.value.find(d => d.alarmTriggered) || allDeviceData.value[0] || {});
const availableDims = ref([
    { name: '温度', value: 'temperature' }, { name: '湿度', value: 'humidity' },
    { name: '压力', value: 'pressure' }, { name: '预测偏差', value: 'predictionError' }
]);
const scatterXAxisDim = ref('temperature');
const scatterYAxisDim = ref('humidity');
const scatterSizeDim = ref('pressure');
const fixedKeywords = [ "温度过高", "信号丢失", "机械阻碍", "软件错误", "连接失败"];
// 初始化累加计数器（响应式）
const cumulativeKeywordCounts = ref({
  "温度过高": 2,
  "信号丢失": 1,
  "机械阻碍": 0,
  "软件错误": 0,
  "连接失败": 0,
  "电池耗尽": 0,
  "设计缺陷": 0,
  "人为损坏": 0,
  "电路短路": 0,
  "系统超时": 0
});
const overallHealthScore = computed(() => {
  const totalDevice = allDeviceData.value.length || 1;
  // 健康分 = (正常设备数 / 总设备数) * 100
  const normalCount = allDeviceData.value.filter(d => d.healthLevel === '正常').length;
  return Math.round((normalCount / totalDevice) * 100);
});

const healthGaugeOption = computed(() => ({
  series: [
    {
      type: 'gauge',
	  center: ['50%', '70%'],
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
const healthLevels = computed(() => {
  const counts = { '正常': 0, '预警': 0, '异常': 0 };
  allDeviceData.value.forEach(d => {
    counts[d.healthLevel]++;
  });
  const total = allDeviceData.value.length || 1;
  return [
    { name: '正常', count: counts['正常'], percentage: (counts['正常']/total)*100, color: '#52c41a' },
    { name: '预警', count: counts['预警'], percentage: (counts['预警']/total)*100, color: '#faad14' },
    { name: '异常', count: counts['异常'], percentage: (counts['异常']/total)*100, color: '#ff4d4f' },
  ];
});
const sankeyOption = computed(() => {
    const nodes = []; const links = []; const nodeSet = new Set();
    allDeviceData.value.forEach(d => {
        const sourceName = d.sensorName || d.sensorId;
        const targetName = `存储: ${d.storageLevel}`;
        if (!nodeSet.has(sourceName)) { nodes.push({ name: sourceName }); nodeSet.add(sourceName); }
        if (!nodeSet.has(targetName)) { nodes.push({ name: targetName }); nodeSet.add(targetName); }
        const existingLink = links.find(l => l.source === sourceName && l.target === targetName);
        if (existingLink) existingLink.value++; else links.push({ source: sourceName, target: targetName, value: 1 });
    });
    return {
        tooltip: { trigger: 'item', triggerOn: 'mousemove' },
		// 在 sankeyOption 计算属性的 series 中
		series: {
			type: 'sankey',
			// --- 新增位置控制 ---
			left: '5%',
			right: '35%',
			top: '10%',
			bottom: '5%',
			// ---------------------
			data: nodes,
			links: links,
			emphasis: { focus: 'adjacency' },
			lineStyle: { color: 'gradient', curveness: 0.5 },
			label: { color: '#fff', fontSize: 14 },
			nodeAlign: 'right', 
			nodeGap: 12,
		}

    };
});
const faultKeywords = computed(() => {
    const keywordCounts = {};
    fixedKeywords.forEach(kw => keywordCounts[kw] = 0);
    allDeviceData.value.forEach(d => {
        if (d.alarmMessage) {
            const match = d.alarmMessage.match(/^(.*?):/);
            const keyword = match ? match[1].trim() : '未知故障';
            if (keywordCounts.hasOwnProperty(keyword)) {
                keywordCounts[keyword]++;
            } else {
                keywordCounts[keyword] = 1;
            }
        }
    });
  return Object.entries(cumulativeKeywordCounts.value)
    .map(([name, value]) => ({ name, value, rank: 0 }))
    .sort((a, b) => b.value - a.value) // 按次数降序
    .map((item, index) => ({ ...item, rank: index + 1 })); // 生成排名
});
// 合并faultKeywordsLeft和faultKeywordsRight为单列数据
// 无需拆分左右列，直接用完整的故障关键词列表
const allFaultKeywords = computed(() => faultKeywords.value);

const wordCloudOption = computed(() => {
    const maxCount = Math.max(...faultKeywords.value.map(item => item.value), 1);
    
    // 目标图配色映射（按关键词匹配对应颜色）
    const keywordColorMap = {
        "温度过高": "#8B9CF6",
        "信号丢失": "#5D76F6",
        "机械阻碍": "#3B5FF6",
        "软件错误": "#2A93F6",
        "连接失败": "#4AC5F6"
    };
    
    // 备用配色列表（未匹配到的关键词使用）
    const fallbackColors = [
        '#8B9CF6', // 浅紫蓝
        '#5D76F6', // 中紫蓝
        '#3B5FF6', // 深紫蓝
        '#2A93F6', // 浅蓝
        '#4AC5F6'  // 浅青
    ];

    return {
        tooltip: { show: true },
        series: [{
            type: 'wordCloud',
            shape: 'circle', // 保持圆形布局（和目标图一致）
            left: 'center', 
            top: 'center',
            width: '95%', 
            height: '95%',
            sizeRange: [14, 45], // 字体大小范围（匹配目标图比例）
            rotationRange: [0, 0], // 文字无旋转（和目标图一致）
            gridSize: 8, // 文字间距优化
            textStyle: {
                color: (params) => {
                    // 优先按关键词匹配颜色，无匹配则循环备用配色
                    return keywordColorMap[params.name] || fallbackColors[params.dataIndex % fallbackColors.length];
                },
                fontWeight: 'bold', // 粗体显示（和目标图一致）
                fontFamily: 'Arial, sans-serif', // 统一字体
                fontSize: (params) => {
                    // 词频越高字体越大，更符合目标图视觉层级
                    return 12 + (params.value / maxCount) * 30;
                }
            },
            emphasis: { 
                textStyle: { 
                    shadowBlur: 15, // 高亮阴影效果
                    shadowColor: 'rgba(255, 255, 255, 0.3)', // 柔和光晕
                    color: '#FFFFFF' // 高亮时文字变白（增强对比）
                } 
            },
            // 过滤无数据的关键词，保持整洁
            data: faultKeywords.value.filter(item => item.value > 0)
        }]
    }
});
const heatmapOption = computed(() => {
    const sensors = allDeviceData.value.map(d => d.sensorName);
    const data = [];
    for (let i = 0; i < sensors.length; i++) {
        for (let j = 0; j < sensors.length; j++) {
            data.push([i, j, i === j ? 1 : parseFloat(Math.random().toFixed(2))]);
        }
    }
    return {
        tooltip: { position: 'top', formatter: params => `${sensors[params.data[0]]} & ${sensors[params.data[1]]}<br/>相关性: ${params.data[2]}` },
        grid: { height: '60%', top: '10%',bottom: '20%', left: '15%', right: '5%' },
        xAxis: { type: 'category', data: sensors, splitArea: { show: true }, axisLabel: { rotate: 30, color: '#ccc', fontSize: 10 } },
        yAxis: { type: 'category', data: sensors, axisLabel: { color: '#ccc', fontSize: 10 } },
        visualMap: { min: 0, max: 1, calculable: true, orient: 'horizontal', left: 'center', bottom: '0%', inRange: { color: ['#313695', '#4575b4', '#fee090', '#f46d43', '#a50026'] }, textStyle: { color: '#fff'} },
        series: [{ name: '温度相关性', type: 'heatmap', data: data, label: { show: sensors.length < 12, color: '#fff', fontSize: 10 }, emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(255, 255, 255, 0.5)' } } }]
    };
});
const scatterOption = computed(() => {
    const scatterData = allDeviceData.value.map(d => ({
        name: d.sensorName,
        value: [
            d[scatterXAxisDim.value] === undefined ? d.predictionError : d[scatterXAxisDim.value],
            d[scatterYAxisDim.value] === undefined ? d.predictionError : d[scatterYAxisDim.value],
            d[scatterSizeDim.value] === undefined ? d.predictionError : d[scatterSizeDim.value],
            d.temperature, d.humidity, d.pressure,
        ]
    }));
    const getDimName = (dimValue) => availableDims.value.find(d => d.value === dimValue)?.name || '';
    return {
        grid: { left: '15%', right: '15%', top: '15%', bottom: '15%' },
        tooltip: {
            formatter: (params) => `<b>${params.data.name}</b><br/>
                ${getDimName(scatterXAxisDim.value)} (X): ${params.data.value[0].toFixed(2)}<br/>
                ${getDimName(scatterYAxisDim.value)} (Y): ${params.data.value[1].toFixed(2)}<br/>
                ${getDimName(scatterSizeDim.value)} (大小): ${params.data.value[2].toFixed(2)}<br/> ---<br/>
                温度: ${params.data.value[3].toFixed(2)}°C<br/> 湿度: ${params.data.value[4].toFixed(2)}%<br/> 压力: ${params.data.value[5].toFixed(2)}hPa`
        },
        xAxis: { type: 'value', name: getDimName(scatterXAxisDim.value), nameLocation: 'middle', nameGap: 25, splitLine: { lineStyle: { color: '#333' } }, axisLabel: { color: '#ccc' }, nameTextStyle: { color: '#ccc' } },
        yAxis: { type: 'value', name: getDimName(scatterYAxisDim.value), splitLine: { lineStyle: { color: '#333' } }, axisLabel: { color: '#ccc' }, nameTextStyle: { color: '#ccc' } },
        visualMap: [{
            left: 'right', top: '10%', dimension: 2, min: 800, max: 1200, itemWidth: 20, itemHeight: 80, calculable: true,
            text: ['大', '小'], textStyle: { color: '#ccc' }, inRange: { symbolSize: [10, 40] }, controller: { inRange: { color: ['#fff'] } }
        }],
        dataZoom: [{ type: 'inside' }, { type: 'slider', xAxisIndex: [0], show: false }, { type: 'slider', yAxisIndex: [0], show: false }],
        brush: { toolbox: ['rect', 'clear'], brushStyle: { borderWidth: 1, color: 'rgba(120,140,180,0.3)', borderColor: 'rgba(120,140,180,0.8)' } },
        series: [{ type: 'scatter', data: scatterData, itemStyle: { color: '#64b5f6' } }]
    };
});
const radarOption = computed(() => {
    const device = selectedDevice.value;
    if (!device.sensorId) return {};
    const indicators = [
        { name: '温度', max: 50 }, { name: '湿度', max: 100 }, { name: '压力', max: 1100 },
        { name: '预测偏差', max: 10 }, { name: '报警风险', max: 100 }
    ];
    const values = [ device.temperature || 0, device.humidity || 0, device.pressure || 0, Math.abs((device.temperature || 0) - (device.predictedTemperature || 0)), device.alarmTriggered ? 95 : 20 ];
    return {
        radar: {
            indicator: indicators,
            shape: 'circle',
            // --- 新增和修改的部分 ---
            center: ['50%', '50%'], // 中心点垂直方向稍微下移一点，给顶部的文字留空间
            radius: '60%',         // 将半径设置为容器较小边的 75%，显著增大雷达图
            // ------------------------
            axisName: { color: '#ccc', fontSize: 12 },
            splitArea: { areaStyle: { color: ['rgba(37, 51, 100, 0.5)', 'rgba(22, 33, 70, 0.5)'] } },
            axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.2)' } },
            splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.2)' } }
        },
        tooltip: { trigger: 'item' },
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
const extremaData = computed(() => {
    if (allDeviceData.value.length === 0) return [];
    const metrics = ['temperature', 'humidity', 'pressure'];
    const names = {'temperature': '温度 (°C)', 'humidity': '湿度 (%)', 'pressure': '压力 (hPa)'};
    return metrics.map(metric => {
        const values = allDeviceData.value.map(d => d[metric]).filter(v => v != null);
        const max = values.length > 0 ? Math.max(...values) : 0;
        const min = values.length > 0 ? Math.min(...values) : 0;
        const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
        const prevAvg = previousAvgData.value[metric] || avg;
        const trend = avg > prevAvg ? 'up' : (avg < prevAvg ? 'down' : 'stable');
        return { name: names[metric], max, min, avg, trend };
    });
});
const storageLevelDistributionOption = computed(() => {
    const counts = allDeviceData.value.reduce((acc, d) => {
        acc[d.storageLevel] = (acc[d.storageLevel] || 0) + 1;
        return acc;
    }, {});
    const data = Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
  return {
    tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c} ({d}%)' },
    legend: { 
      orient: 'vertical', 
      left: '15%', // 图例左移（原是left: 'left'，改为具体百分比）
      top: 'center', 
      textStyle: { color: '#ccc' }, 
      itemWidth: 14, 
      itemHeight: 14, 
    },
    series: [{
      name: '存储层级', 
      type: 'pie', 
      radius: ['50%', '70%'], 
      center: ['70%', '50%'], // 环形图右移（原是75%，减小数值可左移，增大则右移）
      avoidLabelOverlap: false,
      label: { show: false, position: 'center' },
      emphasis: { label: { show: true, fontSize: 20, fontWeight: 'bold', formatter: '{b}\n{c}' } },
      labelLine: { show: false }, 
      data: data
    }]
  };
});
const generateMockData = () => {
  // 保存上一轮平均值用于趋势计算
  if (allDeviceData.value.length > 0) {
    previousAvgData.value = {
      temperature: allDeviceData.value.map(d => d.temperature).filter(v => v != null).reduce((a, b) => a + b, 0) / allDeviceData.value.length,
      humidity: allDeviceData.value.map(d => d.humidity).filter(v => v != null).reduce((a, b) => a + b, 0) / allDeviceData.value.length,
      pressure: allDeviceData.value.map(d => d.pressure).filter(v => v != null).reduce((a, b) => a + b, 0) / allDeviceData.value.length,
    };
  }

  const deviceCount = 10;
  const newData = [];
  const storageLevels = ['REALTIME', 'HOURLY_AVG', 'DAILY_AVG'];
  // 控制异常设备最多3台
  const abnormalCount = Math.floor(Math.random() * 3) + 0; // 0-3台异常
  const warningCount = Math.floor(Math.random() * 3) + 0; // 0-3台预警
  const normalCount = deviceCount - abnormalCount - warningCount;

  // 分配设备状态
  const deviceStatus = [
    ...Array(normalCount).fill('正常'),
    ...Array(warningCount).fill('预警'),
    ...Array(abnormalCount).fill('异常')
  ].sort(() => Math.random() - 0.5); // 随机打乱状态

  // 临时存储本轮新增的故障关键词（用于累加）
  const currentRoundFaults = [];

  for (let i = 1; i <= deviceCount; i++) {
    const status = deviceStatus[i-1];
    let temp = parseFloat((Math.random() * 20 + 15).toFixed(1));
    const predTemp = parseFloat((temp + (Math.random() - 0.5) * 4).toFixed(1));
    let alarmMsg = null;
    let faultKeyword = null;

    // 异常/预警设备的温度模拟及故障关键词生成
    if (status === '异常') {
      temp = 30.1 + Math.random() * 5;
      faultKeyword = fixedKeywords[Math.floor(Math.random() * fixedKeywords.length)];
      alarmMsg = `${faultKeyword}: 检测到异常`;
      currentRoundFaults.push(faultKeyword); // 记录本轮故障关键词
    } else if (status === '预警') {
      temp = 25.1 + Math.random() * 3;
      faultKeyword = fixedKeywords[Math.floor(Math.random() * fixedKeywords.length)];
      alarmMsg = `${faultKeyword}: 检测到预警`;
      currentRoundFaults.push(faultKeyword); // 记录本轮故障关键词
    }

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
      alarmTriggered: status !== '正常',
      alarmMessage: alarmMsg, 
      storageLevel: storageLevels[Math.floor(Math.random() * storageLevels.length)],
      predictionError: Math.abs(temp - predTemp),
      healthLevel: status // 设备健康级别
    });
  }

  // 累加本轮故障关键词到累计计数器
  currentRoundFaults.forEach(keyword => {
    if (cumulativeKeywordCounts.value[keyword] !== undefined) {
      cumulativeKeywordCounts.value[keyword]++;
    }
  });

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
  height: 98vh;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.dashboard-header {
  display: flex;
  justify-content: center; /* 把原有的space-between改成center，让标题居中 */
  align-items: center;
  margin-bottom: 20px;
  padding: 0 10px;
  position: relative; /* 用于后续时间戳的定位 */
}

.dashboard-header h1 {
font-size: 24px; color: #ffffff; letter-spacing: 2px; text-shadow: 0 0 10px #00aaff, 0 0 20px #00aaff; margin: 0; 
}

/* 调整时间戳的位置（避免被居中的标题挤掉） */
.timestamp {
  font-size: 16px;
  color: #94a3b8;
  position: absolute; /* 绝对定位到右上角 */
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
}

.dashboard-grid {
  flex-grow: 1;
  display: grid;
  grid-template-columns: 1fr 1.5fr 1fr;
  grid-template-rows: minmax(0, 1fr);
  gap: 20px;
  /* 新增：确保网格本身不会被内容撑开 */
  min-height: 0;
}

.grid-column,
.grid-column-large {
  display: flex;
  flex-direction: column;
  gap: 20px;
  /* 新增：Flexbox 布局中的防溢出关键属性 */
  min-height: 0;
}

.data-card {
  background: rgba(19, 29, 51, 0.6);
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 0 20px rgba(30, 64, 175, 0.5) inset; 
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  /* 新增：防止卡片内容撑破卡片 */
  min-height: 0px; 
}
.data-card2 {
  background: rgba(19, 29, 51, 0.6);
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 0 20px rgba(30, 64, 175, 0.5) inset; 
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  /* 新增：防止卡片内容撑破卡片 */
  min-height: 340px; 
}

.data-card3 {
  background: rgba(19, 29, 51, 0.6);
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 15px 15px 0px; /* 底部内边距从15px改为5px（最后一个值是底部） */
  box-shadow: 0 0 20px rgba(30, 64, 175, 0.5) inset; 
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  min-height: 280;
  flex-grow: 0.2;
  min-height: 250px; 
}
.data-card4 {
  background: rgba(19, 29, 51, 0.6);
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 15px 15px 0px; /* 底部内边距从15px改为5px（最后一个值是底部） */
  box-shadow: 0 0 20px rgba(30, 64, 175, 0.5) inset; 
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  min-height: 280;
  flex-grow: 0.2;
  min-height: 190px; 
}
.data-card5 {
  background: rgba(19, 29, 51, 0.6);
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 15px 15px 0px; /* 底部内边距从15px改为5px（最后一个值是底部） */
  box-shadow: 0 0 20px rgba(30, 64, 175, 0.5) inset; 
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  min-height: 280;
  flex-grow: 0.2;
  min-height: 230px; 
}

.data-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 150, 255, 0.3);
  border-color: #4f6a91;
}
.data-card2:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 150, 255, 0.3);
  border-color: #4f6a91;
}
.data-card3:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 150, 255, 0.3);
  border-color: #4f6a91;
}
.data-card4:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 150, 255, 0.3);
  border-color: #4f6a91;
}
.data-card5:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 150, 255, 0.3);
  border-color: #4f6a91;
}
.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 3px;
  border-bottom: 1px solid #334155;
  padding-bottom: 10px;
  flex-wrap: wrap;
  /* 确保头部不会被压缩 */
  flex-shrink: 0;
}

/* --- 新增：为中间两个卡片设置特殊的 header margin --- */
.center-card-special-margin .card-header {
  margin-bottom: 20px; /* 在这里设置您想要的更大距离，比如 40px */
}

.center-card-special-margin3 .card-header {
  margin-bottom: 8px; /* 在这里设置您想要的更大距离，比如 40px */
}
.center-card-special-margin4 .card-header {
  margin-bottom: 15px; /* 在这里设置您想要的更大距离，比如 40px */
}
.card-header h3 { margin: 0; font-size: 18px; color: #cbd5e1; font-weight: 500; flex-shrink: 0; }
.card-header .icon { margin-right: 10px; font-size: 20px; color: #64b5f6; }
.icon-health::before { content: '❤️'; } .icon-sankey::before { content: '🌊'; } .icon-heatmap::before { content: '🔥'; }
.icon-radar::before { content: '🎯'; } .icon-scatter::before { content: '✨'; }
.icon-extrema::before { content: '📈'; } .icon-accuracy::before { content: '🔧'; } .icon-storage::before { content: '📦'; }
.icon-keywords::before { content: '🔑'; }

.chart { width: 100%; flex-grow: 1; min-height: 100px; }

.health-overview {
  display: flex;
  gap: 15px;
  flex-grow: 1;
  overflow: hidden;
  /* --- 新增的部分 --- */
   /* 增加一个向下的内边距，把所有内容一起向下推 */
  box-sizing: border-box; /* 确保 padding 不会增加额外的高度 */
}

.health-gauge { width: 50%; flex-shrink: 0; }
.health-stats { width: 50%; display: flex; flex-direction: column; gap: 10px;justify-content: center; }
.stat-item { display: flex; align-items: center; font-size: 14px; }
.stat-item .label { width: 30px; font-weight: bold; }
.stat-item .value { width: 60px; color: #cbd5e1; }
.bar-container { flex-grow: 1; height: 10px; background-color: #334155; border-radius: 5px; overflow: hidden; }
.bar { height: 100%; border-radius: 5px; transition: width 0.5s ease-out; }

.dim-selector { margin-left: auto; display: flex; align-items: center; gap: 8px; font-size: 12px; color: #94a3b8; }
.dim-selector select { background-color: #1e293b; color: #e2e8f0; border: 1px solid #475569; border-radius: 4px; padding: 2px 4px; font-size: 12px; }

.extrema-card .card-header { margin-bottom: 0; }
.extrema-content { flex-grow: 1; display: flex; flex-direction: column; justify-content: space-around; padding: 10px 0; }
.extrema-item { display: flex; align-items: center; justify-content: space-between; }
.extrema-name { color: #94a3b8; font-size: 14px; width: 90px; }
.extrema-values { flex-grow: 1; display: grid; grid-template-columns: 1fr 1fr 1fr; text-align: center; font-size: 14px; font-weight: bold; }
.value-max { color: #ff7875; }
.value-avg { color: #e2e8f0; }
.value-min { color: #52c41a; }
.trend-arrow { margin-left: 4px; font-size: 12px; }
.trend-arrow.up { color: #ff7875; }
.trend-arrow.down { color: #52c41a; }
.trend-arrow.stable { color: #94a3b8; }

.card-header .subtitle-text { margin-left: auto; font-size: 12px; color: #5b6a8e; font-weight: bold; letter-spacing: 1px; align-self: flex-end; }

/* --- “故障关键词”卡片样式修复 --- */
.fault-keywords-card {
  padding-bottom: 5px;
  /* 新增：确保内容不会溢出 */
  overflow: hidden; 
}

.fault-keywords-content {
  display: flex;
  /* 修改：让其弹性增长并能被压缩 */
  flex-grow: 1;
  min-height: 0;
}

.wordcloud-container {
  width: 50%;
  height: 100%;
}

.list-container {
  width: 50%;
  display: flex;
  flex-direction: column;
  padding-left: 10px;
  border-left: 1px solid #334155;
  /* 新增：防止自身被内容撑开 */
  min-height: 0;
}

.list-header {
  display: grid;
  grid-template-columns: 40px 80px 40px; /* 调整列宽（排名/关键词/次数） */
  color: #7b8db1;
  font-size: 12px;
  padding: 8px 10px;
  flex-shrink: 0;
  font-weight: bold;
}
.list-header span:last-child, .list-item .value { text-align: right; }
.list-header span:first-child, .list-item .rank { text-align: center; }

.single-list-wrapper {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.seamless-scroll-wrapper {
  width: 50%;
  height: 100%;
  overflow: hidden;
}

.list-item {
  display: grid;
  grid-template-columns: 40px 80px 40px; /* 与头部列宽对齐 */
  align-items: center;
  padding: 6px 10px;
  font-size: 12px;
  transition: background-color 0.3s;
}
.list-item:hover { background-color: rgba(100, 181, 246, 0.1); }
.list-item .rank { font-weight: bold; font-style: italic; font-size: 14px; color: #a0aec0; text-align: center; }
.list-item .rank.rank-1, .list-item .rank.rank-2, .list-item .rank.rank-3 { font-family: 'Impact', Haettenschweiler, 'Arial Narrow Bold', sans-serif; color: #c084fc; }
.list-item .rank.rank-2 { color: #a78bfa; }
.list-item .rank.rank-3 { color: #818cf8; }
.list-item .name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #cbd5e1; }
.list-item .value { font-weight: bold; color: #e2e8f0; text-align: right; }
</style>

