<template>
  <div class="dashboard-container">
    <div class="header">
      <h1>设备状态实时监控大屏</h1>
      <div class="current-time">{{ currentTime }}</div>
    </div>

    <div v-if="loading" class="loading-text">正在加载设备数据...</div>
    <div v-else-if="!device" class="loading-text">暂无设备数据</div>

    <!-- 主设备面板 -->
    <div v-else class="device-panel-wrapper">
      <!-- 离线遮罩层 -->
      <div v-if="!device.online" class="offline-overlay">
        <div class="offline-text">设备离线</div>
      </div>
      
      <!-- 设备面板主体，通过 :class 绑定离线样式 -->
      <div class="device-panel" :class="{ 'is-offline': !device.online }">
        <div class="device-header">
          <span class="device-icon"></span>
          <h2 class="device-name">{{ device.deviceId }}</h2>
          <span class="status-light" :class="{ 'online': device.online, 'offline': !device.online }"></span>
          <span class="status-text">{{ device.online ? '在线' : '离线' }}</span>
        </div>

        <!-- 传感器区域现在分为明确的行 -->
        <div class="sensor-section">
          <h3 class="section-title">温度传感器</h3>
          <div class="sensor-row">
            <div v-for="sensor in device.temperatureSensors" :key="sensor.sensorId" class="sensor-card">
              <TemperatureGauge :sensor-data="sensor" />
            </div>
          </div>
        </div>

        <div class="sensor-section">
          <h3 class="section-title">温湿压综合传感器</h3>
          <div class="sensor-row">
            <div v-for="sensor in device.multiSensors" :key="sensor.sensorId" class="sensor-card">
              <MultiSensorGauge :sensor-data="sensor" />
            </div>
          </div>
        </div>

        <!-- 高级功能区 -->
        <div class="advanced-section">
          <div class="alarm-log">
            <h3><span class="log-icon"></span>报警日志</h3>
            <el-scrollbar height="180px" class="log-content">
              <div v-if="device.alarms.length === 0" class="no-alarm">暂无报警记录</div>
              <p v-for="(alarm, index) in device.alarms" :key="index">
                <span class="log-time">{{ alarm.time }}</span>
                <span class="log-message">{{ alarm.message }}</span>
              </p>
            </el-scrollbar>
          </div>
          <div class="trend-chart">
            <h3><span class="chart-icon"></span>温度趋势（最近20条）</h3>
            <TemperatureTrendChart :chart-data="device.history" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, reactive, watch, defineComponent, h } from 'vue';
import * as echarts from 'echarts';
import dayjs from 'dayjs';
import { ElScrollbar } from 'element-plus';

// --- 子组件定义 (与之前修复后的版本相同, 此处为简洁省略，请直接复制粘贴下面的完整脚本) ---

// --- 主组件逻辑 ---
const currentTime = ref(dayjs().format('YYYY-MM-DD HH:mm:ss'));
let timer = null;
const loading = ref(true);

// 【修改点1】: 现在只管理一个设备对象，而不是一个包含多个设备的对象
const device = ref(null);

const generateMockData = (deviceId, sensorIndex) => {
    // ... 此函数不变
    const isTempOnly = sensorIndex < 8; // 假设有8个纯温度传感器
    const sensorId = isTempOnly ? `temp-sensor-${sensorIndex + 1}` : `multi-sensor-${sensorIndex - 7}`;
    const sensorName = isTempOnly ? `冷库${sensorIndex + 1}号` : `综合仓${sensorIndex - 7}号`;
    
    const baseTemp = 4 + Math.random() * 2;
    const temp = parseFloat((baseTemp + Math.sin(Date.now() / 10000 + sensorIndex) * 2).toFixed(1));
    const isAlarm = temp > 7.5;

    return {
        id: Math.random().toString(36).substr(2, 9),
        deviceId: deviceId,
        sensorId: sensorId,
        sensorName: sensorName,
        timestamp: new Date().toISOString(),
        temperature: temp,
        humidity: isTempOnly ? null : parseFloat((55 + Math.random() * 10).toFixed(1)),
        pressure: isTempOnly ? null : parseFloat((1010 + Math.random() * 5).toFixed(1)),
        predictedTemperature: parseFloat((temp + (Math.random() - 0.5) * 0.5).toFixed(1)),
        alarmTriggered: isAlarm,
        alarmMessage: isAlarm ? `传感器 [${sensorName} (${sensorId})] 温度过高: ${temp}°C (阈值: 7.5°C)` : "",
    };
};

const updateData = () => {
    // 【修改点2】: 只处理 'jetson-001' 这一个设备
    const deviceId = 'jetson-001';
    const tempSensorCount = 8; // 8个纯温度
    const multiSensorCount = 8; // 8个综合

    // 如果设备对象还未初始化，则创建它
    if (!device.value) {
        device.value = reactive({
            deviceId: deviceId,
            online: true,
            temperatureSensors: [],
            multiSensors: [],
            history: [],
            alarms: []
        });
    }

    // 模拟在线状态随机变化
    device.value.online = Math.random() > 0.15; // 15%的几率离线

    // 如果设备离线，则不更新具体传感器数据
    if (!device.value.online) {
        if(loading.value) loading.value = false;
        return;
    }

    const newTempSensors = [];
    const newMultiSensors = [];

    // 生成纯温度传感器数据
    for (let i = 0; i < tempSensorCount; i++) {
        const newData = generateMockData(deviceId, i);
        newTempSensors.push(newData);

        // 更新历史数据 (仅取第一个传感器作为代表)
        if (i === 0) {
            device.value.history.push(newData);
            if (device.value.history.length > 20) {
                device.value.history.shift();
            }
        }

        // 更新报警日志
        if (newData.alarmTriggered) {
            // 避免重复添加完全相同的报警信息
            const alarmExists = device.value.alarms.some(a => a.message === newData.alarmMessage);
            if (!alarmExists) {
                device.value.alarms.unshift({
                    time: dayjs(newData.timestamp).format('HH:mm:ss'),
                    message: newData.alarmMessage
                });
                if (device.value.alarms.length > 50) {
                    device.value.alarms.pop();
                }
            }
        }
    }
    
    // 生成温湿压传感器数据
    for (let i = tempSensorCount; i < tempSensorCount + multiSensorCount; i++) {
        const newData = generateMockData(deviceId, i);
        newMultiSensors.push(newData);
        if (newData.alarmTriggered) { /* ... 重复报警逻辑 */ }
    }

    device.value.temperatureSensors = newTempSensors;
    device.value.multiSensors = newMultiSensors;

    if (loading.value) loading.value = false;
};

onMounted(() => {
  updateData();
  timer = setInterval(updateData, 3000);
  setInterval(() => {
    currentTime.value = dayjs().format('YYYY-MM-DD HH:mm:ss');
  }, 1000);
});

onUnmounted(() => {
  clearInterval(timer);
});

/* --- 子组件定义（请将这段js完整复制到<script setup>内） --- */
const TemperatureGauge = defineComponent({
  props: ['sensorData'],
  setup(props) {
    const chartRef = ref(null);
    let chartInstance = null;
    const updateChart = () => {
      if (!chartInstance) chartInstance = echarts.init(chartRef.value);
      const option = { series: [{ type: 'gauge', center: ['50%', '60%'], startAngle: 200, endAngle: -20, min: -20, max: 60, splitNumber: 8, itemStyle: { color: props.sensorData.alarmTriggered ? '#ff4d4f' : '#58D9F9' }, progress: { show: true, width: 12 }, pointer: { show: false }, axisLine: { lineStyle: { width: 12 } }, axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false }, detail: { valueAnimation: true, offsetCenter: [0, '10%'], fontSize: 20, fontWeight: 'bold', formatter: '{value}°C', color: 'inherit' }, title: { offsetCenter: [0, '-20%'], fontSize: 12, color: '#fff' }, data: [{ value: props.sensorData.temperature, name: props.sensorData.sensorName }] }] };
      chartInstance.setOption(option);
    };
    onMounted(updateChart);
    onUnmounted(() => chartInstance?.dispose());
    watch(() => props.sensorData, updateChart, { deep: true });
    return () => h('div', { class: `gauge-wrapper ${props.sensorData.alarmTriggered ? 'alarm-active' : ''}` }, [ props.sensorData.alarmTriggered ? h('div', { class: 'alarm-icon' }, '!') : null, h('div', { ref: chartRef, style: 'width:100%; height:130px;' }) ]);
  }
});
const MultiSensorGauge = defineComponent({
  props: ['sensorData'],
  setup(props) {
    const chartRef = ref(null);
    let chartInstance = null;
    const updateChart = () => {
        if (!chartInstance) chartInstance = echarts.init(chartRef.value);
        const option = { tooltip: { formatter: '{a} <br/>{b} : {c}' }, series: [ { name: '温度', type: 'gauge', center: ['50%', '55%'], radius: '100%', min: -20, max: 60, startAngle: 200, endAngle: 130, progress: { show: true, width: 8 }, axisLine: { lineStyle: { width: 8 } }, axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false }, pointer: { show: false }, itemStyle: { color: props.sensorData.alarmTriggered ? '#ff4d4f' : '#58D9F9' }, detail: { valueAnimation: true, offsetCenter: ['-60%', '-15%'], formatter: '{value}°C', fontSize: 12, color: 'inherit' }, data: [{ value: props.sensorData.temperature }] }, { name: '湿度', type: 'gauge', center: ['50%', '55%'], radius: '75%', min: 0, max: 100, startAngle: 120, endAngle: 50, progress: { show: true, width: 8 }, axisLine: { lineStyle: { width: 8 } }, axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false }, pointer: { show: false }, itemStyle: { color: '#91cc75' }, detail: { valueAnimation: true, offsetCenter: ['60%', '-15%'], formatter: '{value}%', fontSize: 12, color: 'inherit' }, data: [{ value: props.sensorData.humidity }] }, { name: '气压', type: 'gauge', center: ['50%', '55%'], radius: '87.5%', min: 900, max: 1100, startAngle: 30, endAngle: -20, progress: { show: true, width: 8 }, axisLine: { lineStyle: { width: 8 } }, axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false }, pointer: { show: false }, itemStyle: { color: '#fac858' }, detail: { valueAnimation: true, offsetCenter: ['0%', '40%'], formatter: '{value}hPa', fontSize: 12, color: 'inherit' }, data: [{ value: props.sensorData.pressure }] }, { type: 'gauge', radius: '0%', detail: { show: false }, title: { offsetCenter: [0, '-25%'], fontSize: 12, color: '#fff', fontWeight: 'bold' }, data: [{ value: 0, name: props.sensorData.sensorName }] } ] };
        chartInstance.setOption(option, true);
    };
    onMounted(updateChart);
    onUnmounted(() => chartInstance?.dispose());
    watch(() => props.sensorData, updateChart, { deep: true });
    return () => h('div', { class: `gauge-wrapper ${props.sensorData.alarmTriggered ? 'alarm-active' : ''}` }, [ props.sensorData.alarmTriggered ? h('div', { class: 'alarm-icon' }, '!') : null, h('div', { ref: chartRef, style: 'width:100%; height:130px;' }) ]);
  }
});
const TemperatureTrendChart = defineComponent({
  props: ['chartData'],
  setup(props) {
    const chartRef = ref(null);
    let chartInstance = null;
    const updateChart = () => {
        if (!chartInstance) chartInstance = echarts.init(chartRef.value, 'dark');
        const times = props.chartData.map(d => dayjs(d.timestamp).format('HH:mm:ss'));
        const temps = props.chartData.map(d => d.temperature);
        const predictedTemps = props.chartData.map(d => d.predictedTemperature);
        const option = { tooltip: { trigger: 'axis' }, legend: { data: ['实际温度', '预测温度'], textStyle: { color: '#ccc' }, bottom: '2%' }, grid: { left: '3%', right: '8%', top: '15%', bottom: '20%', containLabel: true }, xAxis: { type: 'category', boundaryGap: false, data: times, axisLine: { lineStyle: { color: '#555' } } }, yAxis: { type: 'value', axisLabel: { formatter: '{value} °C' }, axisLine: { lineStyle: { color: '#555' } }, splitLine: { lineStyle: { color: '#333' } } }, series: [ { name: '实际温度', type: 'line', smooth: true, data: temps, itemStyle: { color: '#58D9F9' }, areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(88, 217, 249, 0.5)' }, { offset: 1, color: 'rgba(88, 217, 249, 0)' }]) } }, { name: '预测温度', type: 'line', smooth: true, data: predictedTemps, itemStyle: { color: '#ffdb5c' }, areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(255, 219, 92, 0.5)' }, { offset: 1, color: 'rgba(255, 219, 92, 0)' }]) } } ] };
        chartInstance.setOption(option, true);
    };
    onMounted(updateChart);
    onUnmounted(() => chartInstance?.dispose());
    watch(() => props.chartData, updateChart, { deep: true });
    return () => h('div', { ref: chartRef, style: 'width:100%; height:100%;' });
  }
});
</script>

<style scoped>
/* 全局样式 */
.dashboard-container {
  background-color: #020a1b;
  color: #dbeafe;
  padding: 20px;
  min-height: 100vh;
  box-sizing: border-box; /* 确保padding不会撑大容器 */
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
  background-image: 
    radial-gradient(circle at 25% 30%, rgba(22, 78, 99, 0.4) 0%, transparent 40%),
    radial-gradient(circle at 75% 70%, rgba(22, 78, 99, 0.4) 0%, transparent 40%);
}

/* 头部 */
.header { text-align: center; margin-bottom: 20px; position: relative; }
.header h1 { font-size: 24px; color: #ffffff; letter-spacing: 2px; text-shadow: 0 0 10px #00aaff, 0 0 20px #00aaff; margin: 0; }
.current-time { position: absolute; top: 10px; right: 0; font-size: 1.2rem; color: #a0deff; }

/* 加载提示 */
.loading-text { text-align: center; font-size: 1.5rem; margin-top: 100px; color: #a0deff; }

/* 【修改点3】: 设备面板包裹器，用于定位离线遮罩 */
.device-panel-wrapper {
  position: relative;
  width: 100%;
  height: calc(100vh - 120px); /* 视口高度减去头部和padding的大概值 */
  min-height: 700px; /* 保证最小高度 */
}

/* 【修改点4】: 离线遮罩层样式 */
.offline-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(30, 41, 59, 0.7); /* 半透明灰色 */
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20; /* 确保在最上层 */
  backdrop-filter: blur(5px);
}
.offline-text {
  font-size: 2rem;
  font-weight: bold;
  color: #9ca3af; /* 灰色文字 */
  border: 2px solid #6b7280;
  padding: 20px 40px;
  border-radius: 8px;
  text-shadow: 0 0 5px #000;
}

/* 设备面板 */
.device-panel {
  background: rgba(10, 25, 47, 0.8);
  border: 1px solid #1e40af;
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 0 20px rgba(30, 64, 175, 0.5) inset;
  backdrop-filter: blur(5px);
  transition: all 0.5s ease; /* 为变灰增加过渡效果 */
  height: 100%;
  display: flex;
  flex-direction: column;
}
/* 【修改点5】: 设备离线时的样式 */
.device-panel.is-offline {
  border-color: #4b5563; /* 边框变灰 */
  box-shadow: none; /* 去掉发光效果 */
}
.device-panel.is-offline .status-light.online { /* 确保在线灯的动画也停止 */
  animation: none;
}

.device-header { display: flex; align-items: center; padding-bottom: 15px; margin-bottom: 15px; border-bottom: 1px solid #1e3a8a; flex-shrink: 0; }
.device-panel.is-offline .device-header { border-bottom-color: #4b5563; }
.device-icon { width: 24px; height: 24px; margin-right: 10px; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='1.5' stroke='%2338bdf8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 16.5V21m3.75-18v1.5m0 16.5V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V8.25a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 8.25v8.25a2.25 2.25 0 002.25 2.25z' /%3E%3C/svg%3E"); }
.device-name { font-size: 1.5rem; color: #e0f2fe; margin: 0; }
.status-light { width: 12px; height: 12px; border-radius: 50%; margin-left: auto; margin-right: 8px; }
.status-light.online { background-color: #4ade80; box-shadow: 0 0 8px #4ade80; animation: pulse 2s infinite; }
.status-light.offline { background-color: #f87171; box-shadow: 0 0 8px #f87171; }
@keyframes pulse { 0% { transform: scale(0.9); opacity: 0.9; } 50% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(0.9); opacity: 0.9; } }
.status-text { font-size: 1rem; color: #a0deff; }

/* 【修改点6】: 传感器区域和行布局 */
.sensor-section {
  margin-bottom: 20px;
}
.section-title {
  color: #7dd3fc;
  font-size: 1rem;
  margin-bottom: 10px;
  padding-left: 10px;
  border-left: 3px solid #0ea5e9;
}
.sensor-row {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 15px;
}
.sensor-card {
  background: rgba(23, 37, 84, 0.6);
  border-radius: 8px;
  padding-top: 10px;
  border: 1px solid transparent;
  transition: all 0.3s ease;
}

/* 仪表盘和报警图标样式 (不变) */
.gauge-wrapper { position: relative; height: 100%; }
.gauge-wrapper.alarm-active { border: 1px solid #ff4d4f; box-shadow: 0 0 10px #ff4d4f; border-radius: 8px; }
.alarm-icon { position: absolute; top: 5px; right: 5px; width: 20px; height: 20px; background-color: #ff4d4f; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; z-index: 10; animation: blink 1s infinite; }
@keyframes blink { 50% { opacity: 0.5; } }

/* 高级功能区 */
.advanced-section {
  display: grid;
  grid-template-columns: 35% 1fr;
  gap: 20px;
  margin-top: auto; /* 【修改点7】: 将此区域推到底部 */
  padding: 15px;
  border-radius: 8px;
  border-top: 1px solid #1e3a8a;
  background: rgba(10, 25, 47, 0.5);
}
.device-panel.is-offline .advanced-section { border-top-color: #4b5563; }
.advanced-section h3 { font-size: 1.1rem; color: #a0deff; margin: 0 0 10px; display: flex; align-items: center; }
.log-icon, .chart-icon { width: 20px; height: 20px; margin-right: 8px; }
.log-icon { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='1.5' stroke='%23facc15'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z' /%3E%3C/svg%3E"); }
.chart-icon { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='1.5' stroke='%2358D9F9'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1.293 1.293c-.63.63-.184 1.707.707 1.707H17.25m0 0v2.25m-10.5-2.25v-2.25m0 0h-2.25' /%3E%3C/svg%3E"); }

/* 日志和图表样式 (不变) */
.log-content { background-color: rgba(0, 0, 0, 0.2); border-radius: 4px; padding: 10px; }
.log-content p { margin: 0 0 8px; font-size: 0.8rem; color: #fecaca; }
.log-time { color: #9ca3af; margin-right: 10px; }
.no-alarm { color: #6ee7b7; text-align: center; padding: 20px 0; }
.trend-chart { height: 220px; }

/* 响应式调整 */
@media (max-width: 1200px) {
  .advanced-section { grid-template-columns: 1fr; }
  .trend-chart { height: 250px; }
}
@media (max-width: 768px) {
  .header h1 { font-size: 1.8rem; }
  .current-time { display: none; }
  .device-panel-wrapper { height: auto; } /* 在小屏幕上自适应高度 */
}

/* Element Plus 滚动条样式定制 */
:deep(.el-scrollbar__bar .el-scrollbar__thumb) { background-color: #1e40af; }
</style>
