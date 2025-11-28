<template>
  <div class="dashboard-container">
    <div class="header">
      <h1>设备状态实时监控大屏</h1>
      <div class="timestamp">数据更新: {{ currentTime }}</div>
    </div>

    <div v-if="loading" class="loading-text">正在加载设备数据...</div>
    <div v-else-if="!device" class="loading-text">暂无设备数据</div>

    <!-- 主设备面板 -->
    <div v-else class="device-panel-wrapper">      
      <div class="device-panel">
        <div class="device-header">
          <span class="device-icon"></span>
          <h2 class="device-name">{{ device.deviceId }}</h2>
          <span class="status-light online"></span>
          <span class="status-text">在线</span>
        </div>

        <!-- 温度传感器区域（20个，4排×5个） -->
        <div class="sensor-section">
          <!-- 第一排 -->
          <div class="sensor-row">
            <div 
              v-for="sensor in device.temperatureSensors.slice(0, 5)" 
              :key="sensor.sensorId" 
              class="sensor-card"
              :class="getBorderClass(sensor.status)"
            >
              <div class="sensor-left">
                <TemperatureGauge :sensor-data="sensor" />
              </div>
              <div class="sensor-right">
                <div class="detail-item">
                  <span class="label">设备ID</span>
                  <span class="value">{{ sensor.sensorId }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">当前位置</span>
                  <span class="value">虚拟区域{{ Math.floor(sensor.sensorId.split('-')[1]/5)+1 }}-{{ sensor.sensorId.split('-')[1]%5 || 5 }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">当前温度</span>
                  <span class="value" :class="getStatusClass(sensor.status)">{{ sensor.temperature }}°C</span>
                </div>
                <div class="detail-item">
                  <span class="label">温度状态</span>
                  <span class="value" :class="getStatusClass(sensor.status)">{{ getStatusText(sensor.status) }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">预测温度</span>
                  <span class="value">{{ sensor.predictedTemperature.toFixed(1) }}°C</span>
                </div>
              </div>
            </div>
          </div>
          <!-- 第二排 -->
          <div class="sensor-row">
            <div 
              v-for="sensor in device.temperatureSensors.slice(5, 10)" 
              :key="sensor.sensorId" 
              class="sensor-card"
              :class="getBorderClass(sensor.status)"
            >
              <div class="sensor-left">
                <TemperatureGauge :sensor-data="sensor" />
              </div>
              <div class="sensor-right">
                <div class="detail-item">
                  <span class="label">设备ID</span>
                  <span class="value">{{ sensor.sensorId }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">当前位置</span>
                  <span class="value">虚拟区域{{ Math.floor(sensor.sensorId.split('-')[1]/5)+1 }}-{{ sensor.sensorId.split('-')[1]%5 || 5 }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">当前温度</span>
                  <span class="value" :class="getStatusClass(sensor.status)">{{ sensor.temperature }}°C</span>
                </div>
                <div class="detail-item">
                  <span class="label">温度状态</span>
                  <span class="value" :class="getStatusClass(sensor.status)">{{ getStatusText(sensor.status) }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">预测温度</span>
                  <span class="value">{{ sensor.predictedTemperature.toFixed(1) }}°C</span>
                </div>
              </div>
            </div>
          </div>
          <!-- 第三排 -->
          <div class="sensor-row">
            <div 
              v-for="sensor in device.temperatureSensors.slice(10, 15)" 
              :key="sensor.sensorId" 
              class="sensor-card"
              :class="getBorderClass(sensor.status)"
            >
              <div class="sensor-left">
                <TemperatureGauge :sensor-data="sensor" />
              </div>
              <div class="sensor-right">
                <div class="detail-item">
                  <span class="label">设备ID</span>
                  <span class="value">{{ sensor.sensorId }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">当前位置</span>
                  <span class="value">虚拟区域{{ Math.floor(sensor.sensorId.split('-')[1]/5)+1 }}-{{ sensor.sensorId.split('-')[1]%5 || 5 }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">当前温度</span>
                  <span class="value" :class="getStatusClass(sensor.status)">{{ sensor.temperature }}°C</span>
                </div>
                <div class="detail-item">
                  <span class="label">温度状态</span>
                  <span class="value" :class="getStatusClass(sensor.status)">{{ getStatusText(sensor.status) }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">预测温度</span>
                  <span class="value">{{ sensor.predictedTemperature.toFixed(1) }}°C</span>
                </div>
              </div>
            </div>
          </div>
          <!-- 第四排 -->
          <div class="sensor-row">
            <div 
              v-for="sensor in device.temperatureSensors.slice(15, 20)" 
              :key="sensor.sensorId" 
              class="sensor-card"
              :class="getBorderClass(sensor.status)"
            >
              <div class="sensor-left">
                <TemperatureGauge :sensor-data="sensor" />
              </div>
              <div class="sensor-right">
                <div class="detail-item">
                  <span class="label">设备ID</span>
                  <span class="value">{{ sensor.sensorId }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">当前位置</span>
                  <span class="value">虚拟区域{{ Math.floor(sensor.sensorId.split('-')[1]/5)+1 }}-{{ sensor.sensorId.split('-')[1]%5 || 5 }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">当前温度</span>
                  <span class="value" :class="getStatusClass(sensor.status)">{{ sensor.temperature }}°C</span>
                </div>
                <div class="detail-item">
                  <span class="label">温度状态</span>
                  <span class="value" :class="getStatusClass(sensor.status)">{{ getStatusText(sensor.status) }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">预测温度</span>
                  <span class="value">{{ sensor.predictedTemperature.toFixed(1) }}°C</span>
                </div>
              </div>
            </div>
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

// --- 主组件逻辑 ---
const currentTime = ref(dayjs().format('HH:mm:ss'));
let timer = null;
const loading = ref(true);

const device = ref(null);

// 获取状态文本
const getStatusText = (status) => {
  switch(status) {
    case 'normal': return '正常';
    case 'warning': return '预警';
    case 'fault': return '故障';
    case 'offline': return '离线';
    default: return '未知';
  }
};

// 获取状态样式类
const getStatusClass = (status) => {
  switch(status) {
    case 'normal': return 'status-normal';
    case 'warning': return 'status-warning';
    case 'fault': return 'status-fault';
    case 'offline': return 'status-offline';
    default: return '';
  }
};

// 获取边框样式类（根据状态）
const getBorderClass = (status) => {
  switch(status) {
    case 'normal': return 'border-normal';
    case 'warning': return 'border-warning';
    case 'fault': return 'border-fault';
    case 'offline': return 'border-offline';
    default: return '';
  }
};

const generateMockData = (deviceId, sensorIndex) => {
  const sensorId = `MOCK-${String(sensorIndex + 1).padStart(4, '0')}`;
  const sensorName = `冷库${sensorIndex + 1}号`;
  
  // 调整温度范围，让大部分设备保持正常
  const baseTemp = 5 + Math.random() * 2;
  const temp = parseFloat((baseTemp + Math.sin(Date.now() / 10000 + sensorIndex) * 0.8).toFixed(1));
  
  // 状态判断
  let status = 'normal'; // 默认为正常
  
  // 固定10个离线设备（索引10-19）
  if (sensorIndex >= 10) {
    status = 'offline';
  } 
  // 1个预警设备（索引3）
  else if (sensorIndex === 3) {
    status = 'warning';
  } 
  // 1个故障设备（索引7）
  else if (sensorIndex === 7) {
    status = 'fault';
  }

  // 离线设备温度设为0
  const finalTemp = status === 'offline' ? 0 : temp;
  
  return {
    id: Math.random().toString(36).substr(2, 9),
    deviceId: deviceId,
    sensorId: sensorId,
    sensorName: sensorName,
    timestamp: new Date().toISOString(),
    temperature: finalTemp,
    predictedTemperature: parseFloat((finalTemp + (Math.random() - 0.5) * 0.5).toFixed(1)),
    status: status,
    alarmMessage: status === 'fault' ? `传感器 [${sensorName} (${sensorId})] 温度过高: ${finalTemp}°C (阈值: 8.5°C)` : "",
  };
};

const updateData = () => {
  const deviceId = 'jetson-001';
  const tempSensorCount = 20; // 20个纯温度传感器（4排×5个）

  // 如果设备对象还未初始化，则创建它
  if (!device.value) {
    device.value = reactive({
      deviceId: deviceId,
      online: true,
      temperatureSensors: []
    });
  }

  const newTempSensors = [];

  // 生成20个纯温度传感器数据
  for (let i = 0; i < tempSensorCount; i++) {
    newTempSensors.push(generateMockData(deviceId, i));
  }

  device.value.temperatureSensors = newTempSensors;

  if (loading.value) loading.value = false;
};

onMounted(() => {
  updateData();
  timer = setInterval(updateData, 3000);
  setInterval(() => {
    currentTime.value = dayjs().format('HH:mm:ss');
  }, 1000);
});

onUnmounted(() => {
  clearInterval(timer);
});

/* --- 温度仪表盘组件 --- */
const TemperatureGauge = defineComponent({
  props: ['sensorData'],
  setup(props) {
    const chartRef = ref(null);
    let chartInstance = null;
    
    const getStatusColor = () => {
      switch (props.sensorData.status) {
        case 'normal': return '#4ade80'; // 正常-绿色
        case 'warning': return '#facc15'; // 预警-黄色
        case 'fault': return '#ff4d4f'; // 故障-红色
        case 'offline': return '#9ca3af'; // 离线-灰色
        default: return '#58D9F9';
      }
    };

    const updateChart = () => {
      if (!chartInstance) chartInstance = echarts.init(chartRef.value);
      
      // 离线时隐藏温度，显示“离线”
      const detailContent = props.sensorData.status === 'offline' 
        ? '离线' 
        : `{value}°C`;
      
      const option = { 
        series: [{ 
          type: 'gauge', 
          center: ['50%', '60%'], 
          startAngle: 200, 
          endAngle: -20, 
          min: -20, 
          max: 20, 
          splitNumber: 8, 
          itemStyle: { color: getStatusColor() }, // 状态对应颜色
          progress: { show: true, width: 12 }, 
          pointer: { show: false }, 
          axisLine: { lineStyle: { width: 12 } }, 
          axisTick: { show: false }, 
          splitLine: { show: false }, 
          axisLabel: { show: false }, 
          detail: { 
            valueAnimation: props.sensorData.status !== 'offline', // 离线时关闭动画
            offsetCenter: [0, '10%'], 
            fontSize: 18, 
            fontWeight: 'bold', 
            formatter: detailContent, // 离线显示“离线”
            color: 'inherit' 
          }, 
          title: { 
            offsetCenter: [0, '-20%'], 
            fontSize: 12, 
            color: '#fff',
            show: props.sensorData.status !== 'offline' // 离线时隐藏标题
          }, 
          data: [{ 
            value: props.sensorData.status === 'offline' ? 0 : props.sensorData.temperature, 
            name: props.sensorData.sensorName 
          }] 
        }] 
      };
      chartInstance.setOption(option);
    };
    onMounted(updateChart);
    onUnmounted(() => chartInstance?.dispose());
    watch(() => props.sensorData, updateChart, { deep: true });
    return () => h('div', { class: 'gauge-wrapper' }, [ 
      h('div', { ref: chartRef, style: 'width:100%; height:100%;' }) 
    ]);
  }
});
</script>

<style scoped>
/* 全局样式 */
.dashboard-container {
  background-color: #020a1b;
  color: #dbeafe;
  padding: 20px;
  min-height: 98vh;
  box-sizing: border-box;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
  background-image: 
    radial-gradient(circle at 25% 30%, rgba(22, 78, 99, 0.4) 0%, transparent 40%),
    radial-gradient(circle at 75% 70%, rgba(22, 78, 99, 0.4) 0%, transparent 40%);
}

/* 头部 */
.header { text-align: center; margin-bottom: 20px; position: relative; }
.header h1 { font-size: 24px; color: #ffffff; letter-spacing: 2px; text-shadow: 0 0 10px #00aaff, 0 0 20px #00aaff; margin: 0; }
.timestamp {
  font-size: 16px;
  color: #94a3b8;
  position: absolute; 
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
}

/* 加载提示 */
.loading-text { text-align: center; font-size: 1.5rem; margin-top: 100px; color: #a0deff; }

/* 设备面板包裹器 */
.device-panel-wrapper {
  position: relative;
  width: 100%;
  height: 720px;
}

/* 设备面板 */
.device-panel {
  background: rgba(10, 25, 47, 0.8);
  border: 1px solid #1e40af;
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 0 15px rgba(30, 64, 175, 0.5) inset;
  backdrop-filter: blur(5px);
  transition: all 0.5s ease;
  height: auto;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

/* 滚动条样式优化 */
.device-panel::-webkit-scrollbar {
  width: 8px;
}
.device-panel::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}
.device-panel::-webkit-scrollbar-thumb {
  background: #1e40af;
  border-radius: 4px;
}

.device-header { display: flex; align-items: center; padding-bottom: 15px; margin-bottom: 15px; border-bottom: 1px solid #1e3a8a; flex-shrink: 0; }
.device-icon { width: 24px; height: 24px; margin-right: 10px; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='1.5' stroke='%2338bdf8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 16.5V21m3.75-18v1.5m0 16.5V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V8.25a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 8.25v8.25a2.25 2.25 0 002.25 2.25z' /%3E%3C/svg%3E"); }
.device-name { font-size: 1.5rem; color: #e0f2fe; margin: 0; }
.status-light { width: 12px; height: 12px; border-radius: 50%; margin-left: auto; margin-right: 8px; }
.status-light.online { background-color: #4ade80; box-shadow: 0 0 8px #4ade80; animation: pulse 2s infinite; }
@keyframes pulse { 0% { transform: scale(0.9); opacity: 0.9; } 50% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(0.9); opacity: 0.9; } }
.status-text { font-size: 1rem; color: #a0deff; }

/* 传感器区域和行布局 */
.sensor-section {
  margin-bottom: 25px;
}
.sensor-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr); /* 一排5个 */
  gap: 15px;
  margin-bottom: 15px;
}
.sensor-card {
  background: rgba(23, 37, 84, 0.6);
  border-radius: 8px;
  /* 基础边框样式（模仿示例图） */
  border: 2px solid;
  box-shadow: 0 0 8px rgba(0,0,0,0.2);
  transition: all 0.3s ease;
  height: 148px; /* 卡片高度 */
  display: flex;
  overflow: hidden;
  position: relative;
}

/* 不同状态的边框颜色（低饱和度） */
.border-normal {
  border-color: #66b280; /* 低饱和浅绿 */
  box-shadow: 0 0 10px rgba(102, 178, 128, 0.2);
}
.border-warning {
  border-color: #d4c16a; /* 低饱和浅黄 */
  box-shadow: 0 0 10px rgba(212, 193, 106, 0.2);
}
.border-fault {
  border-color: #b35c61; /* 低饱和浅红 */
  box-shadow: 0 0 10px rgba(179, 92, 97, 0.2);
}
.border-offline {
  border-color: #8a9096; /* 低饱和浅灰 */
  box-shadow: 0 0 10px rgba(138, 144, 150, 0.15);
}

/* 传感器卡片左侧：仪表盘 */
.sensor-left {
  width: 50%;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.gauge-wrapper { 
  position: relative; 
  width: 100%; 
  height: 100%; 
}

/* 传感器卡片右侧：详情信息（匹配示例图样式） */
.sensor-right {
  width: 50%;
  padding: 10px 15px;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  background: rgba(10, 25, 47, 0.3);
  border-left: 1px solid rgba(30, 64, 175, 0.2);
}
.detail-item {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  line-height: 1.8;
}
.detail-item .label {
  color: #a0deff;
  font-weight: 400;
}
.detail-item .value {
  color: #fff;
  font-weight: 500;
}

/* 状态样式（匹配示例图颜色） */
.status-normal { color: #4ade80; }
.status-warning { color: #facc15; }
.status-fault { color: #ff4d4f; }
.status-offline { color: #9ca3af; }

/* 响应式调整 */
@media (max-width: 1440px) {
  .sensor-row {
    grid-template-columns: repeat(4, 1fr); /* 中等屏幕一排4个 */
  }
}

@media (max-width: 1024px) {
  .sensor-row {
    grid-template-columns: repeat(3, 1fr); /* 平板一排3个 */
  }
}

@media (max-width: 768px) {
  .header h1 { font-size: 1.8rem; }
  .device-panel-wrapper { height: auto; }
  .sensor-row {
    grid-template-columns: repeat(2, 1fr); /* 手机一排2个 */
  }
}

@media (max-width: 480px) {
  .sensor-row {
    grid-template-columns: 1fr; /* 小手机一排1个 */
  }
}
</style>