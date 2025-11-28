<template>
  <div class="dashboard">
    <!-- 网格背景 -->
    <div
      class="grid-line horizontal"
      v-for="i in 20"
      :key="'h'+i"
      :style="{top: (i*5) + '%'}"
    ></div>
    <div
      class="grid-line vertical"
      v-for="i in 20"
      :key="'v'+i"
      :style="{left: (i*5) + '%'}"
    ></div>
    
    <!-- 数据流效果 -->
    <div
      class="data-stream"
      v-for="i in 10"
      :key="'stream'+i"
      :style="{
        left: Math.random() * 100 + '%',
        animationDelay: Math.random() * 5 + 's',
        height: Math.random() * 100 + 50 + 'px'
      }"
    ></div>
    
    <div class="header">
      <div class="header-left">
        <div class="update-info">
          <div class="update-time">数据更新: {{ lastUpdate }}</div>
          <div class="device-count">
            {{ isUsingMockData ? '使用虚拟数据' : '实时数据获取中' }}
          </div>
        </div>
      </div>
      <div class="title">工业测温监控平台</div>
      <div class="header-right">
        <div class="time">{{ currentTime }}</div>
      </div>
    </div>
    
    <div class="main-content">
      <!-- 左侧面板 -->
      <div class="left-panel">
        <div class="panel">
          <div class="panel-title">
            <i>📊</i> 设备状态分布
          </div>
          <div class="ring-chart-container">
            <div class="ring-gauge-container">
              <div class="ring-gauge-item">
                <div class="ring-gauge-title">正常设备</div>
                <div class="ring-gauge-chart" ref="gaugeChartNormalRef"></div>
                <div class="ring-gauge-label">{{ normalDevices }}台设备</div>
              </div>
              <div class="ring-gauge-item">
                <div class="ring-gauge-title">预警设备</div>
                <div class="ring-gauge-chart" ref="gaugeChartWarningRef"></div>
                <div class="ring-gauge-label">{{ warningDevices }}台设备</div>
              </div>
              <div class="ring-gauge-item">
                <div class="ring-gauge-title">异常设备</div>
                <div class="ring-gauge-chart" ref="gaugeChartDangerRef"></div>
                <div class="ring-gauge-label">{{ dangerDevices }}台设备</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 设备状态概览模块 -->
        <div class="panel">
          <div class="panel-title">
            <i>🌡️</i> 设备状态概览
          </div>
          <div class="status-overview-container">
            <div class="status-scroll-wrapper">
              <div 
                v-for="device in devices" 
                :key="device.deviceId" 
                class="status-item"
                :class="{ active: device.deviceId === selectedDevice?.deviceId }"
                :style="{ transform: `translateY(-${deviceScrollOffset}px)` }"
              >
                <div class="status-device">{{ device.deviceId }}</div>
                <div class="status-temp" :class="getTempClass(device.temperature)">
                  {{ device.temperature }}°C
                </div>
                <div class="status-location">{{ device.location }}</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 最新告警模块 -->
        <div class="panel">
          <div class="panel-title">
            <i>🔔</i> 最新告警
            <div class="alert-stats" v-if="recentAlerts.length > 0">
              <span class="stat-danger">{{ getAlertStats().dangerAlerts }} 紧急</span>
              <span class="stat-warning">{{ getAlertStats().warningAlerts }} 警告</span>
            </div>
          </div>
          <div class="alerts-container">
            <div v-if="recentAlerts.length === 0" class="no-alerts">
              <div class="no-alerts-icon">✅</div>
              <div class="no-alerts-text">暂无告警</div>
            </div>
            <div v-else class="alerts-scroll-wrapper" @mouseenter="pauseAlertCarousel" @mouseleave="resumeAlertCarousel">
              <div 
                v-for="alert in recentAlerts" 
                :key="alert.id" 
                class="alert-item"
                :class="{
                  'alert-danger': alert.level === 'danger',
                  'alert-warning': alert.level === 'warning',
                  'alert-info': alert.level === 'info',
                  'alert-acknowledged': alert.acknowledged
                }"
                @click="acknowledgeAlert(alert.id)"
              >
                <div class="alert-header">
                  <div class="alert-time">{{ alert.time }}</div>
                  <div class="alert-level" :class="alert.level">
                    {{ alert.level === 'danger' ? '紧急' : alert.level === 'warning' ? '警告' : '信息' }}
                  </div>
                </div>
                <div class="alert-content">
                  <div class="alert-device">{{ alert.deviceId }}</div>
                  <div class="alert-message">{{ alert.message }}</div>
                </div>
                <div v-if="alert.acknowledged" class="alert-acknowledged-badge">已确认</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 系统运行状态模块 -->
        <div class="panel">
          <div class="panel-title">
            <i>⚙️</i> 系统运行状态
          </div>
          <div class="system-status">
            <div class="status-item">
              <div class="status-label">数据接收</div>
              <div class="status-value normal">正常</div>
            </div>
            <div class="status-item">
              <div class="status-label">预测算法</div>
              <div class="status-value normal">运行中</div>
            </div>
            <div class="status-item">
              <div class="status-label">网络延迟</div>
              <div class="status-value normal">{{ networkDelay }}ms</div>
            </div>
          </div>
        </div>

      </div>
      
      <!-- 中间面板 - 3D可视化 -->
      <div class="center-panel">
        <!-- 3D工厂管道可视化 -->
        <div class="panel" style="flex: 1; position: relative;">
          <div class="panel-title">
            <i>🏭</i> 工厂管道3D可视化
            <!-- 工厂切换器移到中间 -->
            <div class="factory-selector-center">
              <button class="factory-nav-btn prev" @click="prevFactory">◀</button>
              <span class="factory-name">{{ factoryNames[currentFactoryIndex] }}</span>
              <button class="factory-nav-btn next" @click="nextFactory">▶</button>
            </div>
            <!-- 右侧添加保存按钮 -->
            <div class="factory-controls-right">
              <button class="save-positions-btn" @click="saveDevicePositions" :disabled="!hasPositionChanges">
                💾 保存位置
              </button>
            </div>
          </div>
          
          <div class="factory-pipeline-3d">
            <!-- 替换原来的 img 标签 -->
            <div class="scene-container" ref="sceneContainer">
              <video 
                v-if="currentFactoryIndex === 1" 
                :src="currentFactoryImage" 
                class="factory-video" 
                autoplay 
                muted 
                loop
                @error="handleVideoError"
              ></video>
              <img 
                v-else
                :src="currentFactoryImage" 
                class="factory-map" 
                alt="工厂地图" 
                @error="handleImageError"
              >
            </div>
            
            <!-- 设备信息提示框 - 简化版 -->
            <div class="device-tooltip" :class="{ show: showTooltip }" :style="tooltipStyle">
              <div class="tooltip-title">{{ tooltipDevice ? tooltipDevice.deviceId : '' }}</div>
              <div class="tooltip-item">
                <span class="tooltip-label">温度:</span>
                <span class="tooltip-value" :class="getTempClass(tooltipDevice ? tooltipDevice.temperature : 0)">
                  {{ tooltipDevice ? tooltipDevice.temperature : '' }}°C
                </span>
              </div>
            </div>
            
            <!-- 加载状态 -->
            <div v-if="loading3D" class="loading-overlay">
              <div class="loading-spinner"></div>
              <div class="loading-text">加载3D场景中...</div>
            </div>
          </div>
        </div>
		
		<!-- 设备状态总览面板 -->
		<div class="panel overview-panel">
		  <div class="panel-title">
		    <i>📋</i> 设备状态总览
		  </div>
		  <div class="stats-container">
		    <div class="stat-item">
		      <div class="stat-label">总设备数</div>
		      <div class="stat-value">{{ deviceStats.totalCount }}</div>
		    </div>
		    <div class="stat-item">
		      <div class="stat-label">在线设备</div>
		      <div class="stat-value stat-normal">{{ deviceStats.onlineCount }}</div>
		    </div>
		    <div class="stat-item">
		      <div class="stat-label">离线设备</div>
		      <div class="stat-value">{{ deviceStats.offlineCount }}</div>
		    </div>
		  </div>
		</div>
        

      </div>
      
      <!-- 右侧面板 -->
      <div class="right-panel">
        <!-- 设备分布3D曲面图 -->
        <div class="panel" style="flex: 1.5; position: relative;">
          <div class="panel-title">
            <i>📍</i> 设备分布3D曲面图
          </div>
          <div class="device-map-container">
            <div class="surface-3d-chart" ref="surface3dChartRef"></div>
          </div>
        </div>
        
        <!-- 设备详情小框 -->
        <div class="panel device-detail-panel">
          <div class="panel-title">
            <i>📱</i> 设备详情 - {{ selectedDevice ? selectedDevice.deviceId : '' }}
            <button class="detail-panel-btn" @click="showDeviceDetailPanel" v-if="selectedDevice">
              设备面板
            </button>
          </div>
          <div class="device-detail-content" v-if="selectedDevice">
            <div class="detail-info">
              <div class="info-item">
                <div class="info-label">设备ID</div>
                <div class="info-value">{{ selectedDevice.deviceId }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">当前位置</div>
                <div class="info-value">{{ selectedDevice.location }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">当前温度</div>
                <div class="info-value" :class="getTempClass(selectedDevice.temperature)">
                  {{ selectedDevice.temperature }}°C
                </div>
              </div>
              <div class="info-item">
                <div class="info-label">温度状态</div>
                <div class="info-value">{{ getTempStatus(selectedDevice.temperature) }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">预测温度</div>
                <div class="info-value">{{ selectedDevice.predictedTemp }}°C</div>
              </div>
            </div>
          </div>
        </div>
        
		<!-- 温度趋势预测模块 -->
		<div class="panel">
      <!-- 在温度趋势预测模块的 panel-title 中添加 -->
      <div class="panel-title">
        <i>📈</i> 温度趋势预测 - {{ selectedDevice ? selectedDevice.deviceId : '' }}
        <div class="prediction-controls">
          <select v-model="predictionInterval" @change="onPredictionIntervalChange" class="interval-select">
            <option value="5">预测5秒后</option>
            <option value="10">预测10秒后</option>
          </select>
        </div>
        <div v-if="historyLoading" class="loading-indicator">
          <span class="loading-text">加载中...</span>
        </div>
      </div>
		  <div class="chart-container">
			<div class="prediction-chart" ref="predictionChartRef"></div>
			<div v-if="!selectedDevice" class="no-data-prompt">
			  <div class="no-data-icon">📊</div>
			  <div class="no-data-text">请选择设备查看温度趋势</div>
			</div>
			<div v-else-if="temperatureHistory.timestamps.length === 0 && !historyLoading" class="no-data-prompt">
			  <div class="no-data-icon">📈</div>
			  <div class="no-data-text">暂无历史温度数据</div>
			</div>
		  </div>
		</div>
      </div>
    </div>
    
    <!-- 设备详情面板模态框 -->
    <div class="device-detail-modal" v-if="showDetailPanel">
      <div class="modal-overlay" @click="closeDeviceDetailPanel"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h2>设备详情 - {{ selectedDevice ? selectedDevice.deviceId : '' }}</h2>
          <button class="close-btn" @click="closeDeviceDetailPanel">✕</button>
        </div>
        <div class="modal-body">
          <div class="detail-grid">
            <!-- 左上角：设备详情信息 -->
            <div class="detail-section">
              <h3>设备信息</h3>
              <div class="detail-info-grid">
                <div class="detail-info-item">
                  <span class="detail-label">设备ID:</span>
                  <span class="detail-value">{{ selectedDevice ? selectedDevice.deviceId : '' }}</span>
                </div>
                <div class="detail-info-item">
                  <span class="detail-label">当前位置:</span>
                  <span class="detail-value">{{ selectedDevice ? selectedDevice.location : '' }}</span>
                </div>
                <div class="detail-info-item">
                  <span class="detail-label">当前温度:</span>
                  <span class="detail-value" :class="getTempClass(selectedDevice ? selectedDevice.temperature : 0)">
                    {{ selectedDevice ? selectedDevice.temperature : '' }}°C
                  </span>
                </div>
                <div class="detail-info-item">
                  <span class="detail-label">温度状态:</span>
                  <span class="detail-value">{{ getTempStatus(selectedDevice ? selectedDevice.temperature : 0) }}</span>
                </div>
                <div class="detail-info-item">
                  <span class="detail-label">预测温度:</span>
                  <span class="detail-value">{{ selectedDevice ? selectedDevice.predictedTemp : '' }}°C</span>
                </div>
                <div class="detail-info-item">
                  <span class="detail-label">上线时间:</span>
                  <span class="detail-value">{{ selectedDevice ? selectedDevice.onlineTime : '' }}</span>
                </div>
                <div class="detail-info-item">
                  <span class="detail-label">最后维护:</span>
                  <span class="detail-value">{{ selectedDevice ? selectedDevice.lastMaintenance : '' }}</span>
                </div>
                <div class="detail-info-item">
                  <span class="detail-label">数据上传:</span>
                  <span class="detail-value" :class="selectedDevice && selectedDevice.isUploaded ? 'status-normal' : 'status-danger'">
                    {{ selectedDevice && selectedDevice.isUploaded ? '正常' : '异常' }}
                  </span>
                </div>
              </div>
            </div>
            
            <!-- 右上角：温度趋势图 -->
            <div class="detail-section">
              <h3>温度趋势</h3>
              <div class="chart-container">
                <div class="temperature-trend-chart" ref="temperatureTrendChartRef"></div>
              </div>
            </div>
            
            <!-- 下方：警告信息曲线图 -->
            <div class="detail-section full-width">
              <h3>告警历史</h3>
              <div class="time-range-selector">
                <button 
                  v-for="range in timeRanges" 
                  :key="range.value"
                  :class="{ active: selectedTimeRange === range.value }"
                  @click="changeTimeRange(range.value)"
                  :disabled="alertHistoryLoading"
                >
                  {{ range.label }}
                  <span v-if="alertHistoryLoading && selectedTimeRange === range.value">...</span>
                </button>
              </div>
              <div class="chart-container">
                <!-- 添加加载状态 -->
                <div v-if="alertHistoryLoading" class="loading-overlay">
                  <div class="loading-spinner"></div>
                  <div class="loading-text">加载告警历史中...</div>
                </div>
                <div class="alert-history-chart" ref="alertHistoryChartRef"></div>
                <!-- 添加无数据提示 -->
                <div v-if="!alertHistoryLoading && alertHistoryData.dates.length === 0" class="no-data-prompt">
                  <div class="no-data-icon">📊</div>
                  <div class="no-data-text">暂无告警历史数据</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import 'echarts-gl'
import A from './A.jpg'
import B from './B.avi'
import C from './C.jpg'

export default {
  name: 'IndustrialTemperatureDashboard',
  setup() {
    // API 配置
    const API_CONFIG = {
      BASE_URL: 'http://localhost:8080/api',
      ENDPOINTS: {
        SENSOR_LATEST: '/sensor-latest',
        SENSOR_STATUS_SUMMARY: '/sensor-status-summary',
        DEVICE_SUMMARY: '/device/summary'
      }
    }

    // 响应式数据
    const currentTime = ref('')
    const devices = ref([])
    const selectedDevice = ref(null)
    const predictionChart = ref(null)
    const gaugeChartNormal = ref(null)
    const gaugeChartWarning = ref(null)
    const gaugeChartDanger = ref(null)
    const surface3dChart = ref(null)
    const recentAlerts = ref([])
    const networkDelay = ref(42)
    const lastUpdate = ref('')
    const onlineDevices = ref(0)
    const totalDevices = ref(0)
    const deviceCarouselInterval = ref(null)
    const alertCarouselInterval = ref(null)
    const currentAlertIndex = ref(0)
    const deviceScrollOffset = ref(0)
    const alertScrollOffset = ref(0)
    const isUsingMockData = ref(false)
    const alertHistoryData = ref({
    dates: [],
    alertCounts: []
    })
    const predictionInterval = ref(10)
    const alertHistoryLoading = ref(false)
    // 控制自动轮播的状态
    const autoCarouselEnabled = ref(true)
    // 响应式数据 - 在现有数据后面添加
    const deviceStats = ref({
      onlineCount: 0,
      offlineCount: 0,
      totalCount: 0
    })

    // 暂停告警轮播
    const pauseAlertCarousel = () => {
      if (alertCarouselInterval.value) {
        clearInterval(alertCarouselInterval.value)
        alertCarouselInterval.value = null
      }
    }

    // 恢复告警轮播
    const resumeAlertCarousel = () => {
      if (!alertCarouselInterval.value) {
        startAlertCarousel()
      }
    }

    // 告警级别常量
    const ALERT_LEVELS = {
      DANGER: 'danger',
      WARNING: 'warning',
      INFO: 'info'
    }

    // 3D可视化相关数据
    const sceneContainer = ref(null)
    const loading3D = ref(true)
    const autoRotate = ref(true)
    let animationId = null
    let sceneObjects = []
    let cameraAngle = 0
    let cameraDistance = 300
    let cameraHeight = 200

    // DOM 引用
    const gaugeChartNormalRef = ref(null)
    const gaugeChartWarningRef = ref(null)
    const gaugeChartDangerRef = ref(null)
    const predictionChartRef = ref(null)
    const surface3dChartRef = ref(null)

    // 新增响应式数据 - 设备提示框
    const showTooltip = ref(false)
    const tooltipDevice = ref(null)
    const tooltipStyle = reactive({
      left: '0px',
      top: '0px'
    })

    // 设备详情面板相关
    const showDetailPanel = ref(false)
    const temperatureTrendChart = ref(null)
    const alertHistoryChart = ref(null)
    const temperatureTrendChartRef = ref(null)
    const alertHistoryChartRef = ref(null)
    const selectedTimeRange = ref('week')
    const timeRanges = ref([
      { label: '一周', value: 'week' },
      { label: '一月', value: 'month' },
      { label: '三月', value: 'quarter' },
      { label: '一年', value: 'year' }
    ])

    // 新增：工厂配置
    const currentFactoryIndex = ref(0)
    const factoryNames = ref(['工厂A', '工厂B', '工厂C'])
    const factoryImages = ref([A, B, C])
    
    // 新增：设备位置保存相关
    const hasPositionChanges = ref(false)
    const originalDevicePositions = ref({})
    
    const handleVideoError = (event) => {
      console.error('视频加载失败:', currentFactoryImage.value)
      // 可以设置备用方案
    }  

    // 三套不同的设备初始位置
    const factoryDevicePositions = ref([
      // 工厂A的设备位置
      [
        { x: 1179 * 0.25, y: 1061 * 0.35 },
        { x: 1179 * 0.80, y: 1061 * 0.15 },
        { x: 1179 * 0.10, y: 1061 * 0.76 },
        { x: 1179 * 0.83, y: 1061 * 0.85 },
        { x: 1179 * 0.5, y: 1061 * 0.15 },
        { x: 1179 * 0.50, y: 1061 * 0.85 },
        { x: 1179 * 0.90, y: 1061 * 0.60 },
        { x: 1179 * 0.85, y: 1061 * 0.40 },
        { x: 1179 * 0.5, y: 1061 * 0.6 },
        { x: 1179 * 0.3, y: 1061 * 0.7 }
      ],
      // 工厂B的设备位置
      [
        { x: 1179 * 0.15, y: 1061 * 0.25 },
        { x: 1179 * 0.75, y: 1061 * 0.20 },
        { x: 1179 * 0.20, y: 1061 * 0.70 },
        { x: 1179 * 0.70, y: 1061 * 0.75 },
        { x: 1179 * 0.40, y: 1061 * 0.25 },
        { x: 1179 * 0.60, y: 1061 * 0.80 },
        { x: 1179 * 0.85, y: 1061 * 0.50 },
        { x: 1179 * 0.80, y: 1061 * 0.30 },
        { x: 1179 * 0.45, y: 1061 * 0.55 },
        { x: 1179 * 0.25, y: 1061 * 0.65 }
      ],
      // 工厂C的设备位置
      [
        { x: 1179 * 0.35, y: 1061 * 0.20 },
        { x: 1179 * 0.70, y: 1061 * 0.25 },
        { x: 1179 * 0.15, y: 1061 * 0.65 },
        { x: 1179 * 0.65, y: 1061 * 0.70 },
        { x: 1179 * 0.30, y: 1061 * 0.35 },
        { x: 1179 * 0.55, y: 1061 * 0.75 },
        { x: 1179 * 0.80, y: 1061 * 0.45 },
        { x: 1179 * 0.75, y: 1061 * 0.35 },
        { x: 1179 * 0.40, y: 1061 * 0.50 },
        { x: 1179 * 0.20, y: 1061 * 0.60 }
      ]
    ])
    
    // 当前工厂图片
    const currentFactoryImage = computed(() => {
      const imagePath = factoryImages.value[currentFactoryIndex.value]
      console.log('当前工厂图片路径:', imagePath)
      console.log('当前工厂索引:', currentFactoryIndex.value)
      return imagePath
    })
    
    // 当前工厂的设备位置
    const currentDevicePositions = computed(() => {
      return factoryDevicePositions.value[currentFactoryIndex.value]
    })

    // 计算属性 - 根据后端数据计算设备状态分布
    const normalDevices = computed(() => {
      return devices.value.filter(d => !d.alarmTriggered && d.isUploaded).length
    })
    
    const warningDevices = computed(() => {
      return devices.value.filter(d => d.alarmTriggered && d.isUploaded).length
    })
    
    const dangerDevices = computed(() => {
      return devices.value.filter(d => !d.isUploaded).length
    })
    
    const normalPercentage = computed(() => {
      return totalDevices.value > 0 ? Math.round((normalDevices.value / totalDevices.value) * 100) : 0
    })
    
    const warningPercentage = computed(() => {
      return totalDevices.value > 0 ? Math.round((warningDevices.value / totalDevices.value) * 100) : 0
    })
    
    const dangerPercentage = computed(() => {
      return totalDevices.value > 0 ? Math.round((dangerDevices.value / totalDevices.value) * 100) : 0
    })
    
    const currentAlert = computed(() => {
      return recentAlerts.value[currentAlertIndex.value]
    })

    const deviceCount = computed(() => {
      return devices.value.length
    })
	
  // 获取设备状态统计
  const fetchDeviceStatusSummary = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/device/summary`)
      if (response.ok) {
        const summaryData = await response.json()
        // 无论后端返回什么，都加上虚拟设备的统计
        const mockDevicesCount = devices.value.filter(d => d.isMock).length
        const mockOnlineCount = devices.value.filter(d => d.isMock && d.isUploaded).length
        
        deviceStats.value = {
          onlineCount: (summaryData.onlineCount || 0) + mockOnlineCount,
          offlineCount: (summaryData.offlineCount || 0) + (mockDevicesCount - mockOnlineCount),
          totalCount: (summaryData.totalCount || 0) + mockDevicesCount
        }
        console.log('设备状态统计（包含虚拟设备）:', deviceStats.value)
      } else {
        console.error('获取设备状态统计失败:', response.status)
        // 直接从所有设备计算统计，包含虚拟设备
        updateDeviceStatsFromAllDevices()
      }
    } catch (error) {
      console.error('获取设备状态统计错误:', error)
      isUsingMockData.value = true
      // 直接从所有设备计算统计，包含虚拟设备
      updateDeviceStatsFromAllDevices()
    }
  }
	
  // 从所有设备计算统计信息（包含虚拟设备）
  const updateDeviceStatsFromAllDevices = () => {
    deviceStats.value = {
      onlineCount: devices.value.filter(d => d.isUploaded).length,
      offlineCount: devices.value.filter(d => !d.isUploaded).length,
      totalCount: devices.value.length
    }
  }
  // 获取设备告警历史数据
  const fetchAlertHistory = async (deviceId) => {
    if (!deviceId) return
    
    alertHistoryLoading.value = true
    try {
      // 如果是虚拟设备，使用模拟数据
      const device = devices.value.find(d => d.deviceId === deviceId)
      if (device && device.isMock) {
        useMockAlertHistory(deviceId)
        return
      }
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/alerts/history/${deviceId}?range=${selectedTimeRange.value}`)
      if (response.ok) {
        const historyData = await response.json()
        alertHistoryData.value = historyData
        updateAlertHistoryChart()
      } else {
        console.error('获取告警历史失败:', response.status)
        useMockAlertHistory(deviceId)
      }
    } catch (error) {
      console.error('获取告警历史错误:', error)
      useMockAlertHistory(deviceId)
    } finally {
      alertHistoryLoading.value = false
    }
  }

  // 模拟告警历史数据
  const useMockAlertHistory = (deviceId) => {
    const { dates, alertCounts } = generateRealisticAlertHistory(deviceId)
    alertHistoryData.value = { dates, alertCounts }
    updateAlertHistoryChart()
  }

  // 生成更真实的告警历史数据
  const generateRealisticAlertHistory = (deviceId) => {
    const dates = []
    const alertCounts = []
    const now = new Date()
    
    // 根据设备状态生成不同的告警模式
    const device = devices.value.find(d => d.deviceId === deviceId)
    const isProblematicDevice = device && (device.alarmTriggered || !device.isUploaded)
    
    let days = 7
    if (selectedTimeRange.value === 'month') days = 30
    else if (selectedTimeRange.value === 'quarter') days = 90
    else if (selectedTimeRange.value === 'year') days = 365
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      
      // 根据时间范围调整日期格式
      let dateString
      if (selectedTimeRange.value === 'week') {
        dateString = date.toLocaleDateString([], { month: 'short', day: 'numeric' })
      } else if (selectedTimeRange.value === 'month') {
        dateString = date.toLocaleDateString([], { month: 'short', day: 'numeric' })
      } else {
        dateString = date.toLocaleDateString([], { month: 'short', year: 'numeric' })
      }
      dates.push(dateString)
      
      // 更智能的告警计数逻辑
      let baseCount = 0
      
      if (isProblematicDevice) {
        // 问题设备：更高的告警频率，可能有告警高峰
        if (i % 3 === 0) { // 每3天有一次告警高峰
          baseCount = Math.floor(Math.random() * 8) + 3
        } else if (i % 7 === 0) { // 每周有一次严重告警
          baseCount = Math.floor(Math.random() * 5) + 1
        } else {
          baseCount = Math.floor(Math.random() * 3)
        }
      } else {
        // 正常设备：偶尔有告警
        baseCount = Math.floor(Math.random() * 2)
        
        // 正常设备也可能有偶尔的高峰（维护期间）
        if (i === 14 || i === 45) { // 模拟维护期间的告警
          baseCount = Math.floor(Math.random() * 4) + 2
        }
      }
      
      // 添加季节性因素（如果是年度数据）
      if (selectedTimeRange.value === 'year') {
        const month = date.getMonth()
        // 夏季（6-8月）温度相关告警可能增加
        if (month >= 5 && month <= 7) {
          baseCount = Math.min(baseCount + Math.floor(Math.random() * 2), 10)
        }
      }
      
      alertCounts.push(baseCount)
    }
    
    return { dates, alertCounts }
  }

	// 在现有的响应式数据后面添加
	const temperatureHistory = ref({
	  timestamps: [],
	  actual: [],
	  predicted: []
	})
	const historyLoading = ref(false)
	
  // 获取设备温度历史数据
  const fetchTemperatureHistory = async (deviceId) => {
    if (!deviceId) return
    
    // 如果是虚拟设备，直接使用模拟数据
    const device = devices.value.find(d => d.deviceId === deviceId)
    if (device && device.isMock) {
      useMockTemperatureHistory(deviceId)
      return
    }
    
    historyLoading.value = true
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/sensor-curve/${deviceId}?limit=20&interval=${predictionInterval.value}`)
      if (response.ok) {
        const historyData = await response.json()
        
        // 修改：处理预测温度的时间偏移
        const { timestamps, actual, predicted } = historyData
        
        // 为预测温度创建新的时间戳（延后predictionInterval秒）
        const predictedTimestamps = timestamps.map(timestamp => {
          const date = new Date(timestamp)
          date.setSeconds(date.getSeconds() + parseInt(predictionInterval.value))
          return date.toLocaleTimeString()
        })
        
        // 合并时间戳：实际温度的时间戳 + 最后一个预测温度的时间戳
        const allTimestamps = [...timestamps, predictedTimestamps[predictedTimestamps.length - 1]]
        
        // 为实际温度数据添加null值以对齐时间轴
        const extendedActual = [...actual, null]
        
        // 为预测温度数据添加null值以对齐时间轴
        const extendedPredicted = [null, ...predicted]
        
        temperatureHistory.value = {
          timestamps: allTimestamps,
          actual: extendedActual,
          predicted: extendedPredicted
        }
        
        console.log('处理后的温度历史数据:', temperatureHistory.value)
        updatePredictionChartWithHistory()
      } else {
        console.error('获取温度历史数据失败:', response.status)
        useMockTemperatureHistory(deviceId)
      }
    } catch (error) {
      console.error('获取温度历史数据错误:', error)
      useMockTemperatureHistory(deviceId)
    } finally {
      historyLoading.value = false
    }
  }

  // 添加预测间隔变更处理方法
  const onPredictionIntervalChange = () => {
    console.log(`预测间隔变更为: ${predictionInterval.value}秒`)
    if (selectedDevice.value) {
      fetchTemperatureHistory(selectedDevice.value.deviceId)
    }
  }

  const updateAlertHistoryChart = () => {
    if (alertHistoryChart.value && alertHistoryData.value.dates.length > 0) {
      const { dates, alertCounts } = alertHistoryData.value
      
      const option = {
        tooltip: {
          trigger: 'axis',
          textStyle: {
            color: '#fff'
          },
          backgroundColor: 'rgba(16, 35, 70, 0.9)',
          borderColor: '#4facfe',
          formatter: function(params) {
            const date = params[0].axisValue
            const count = params[0].value
            return `
              <div style="font-weight:bold;margin-bottom:5px;">${date}</div>
              <div style="display:flex;align-items:center;">
                <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#ff4d4d;margin-right:5px;"></span>
                告警次数: <span style="color:#ff4d4d;font-weight:bold;margin-left:5px;">${count} 次</span>
              </div>
            `
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '15%',
          top: '15%',
          containLabel: true
        },
        dataZoom: [
          {
            type: 'inside',
            start: 0,
            end: 100
          },
          {
            type: 'slider',
            show: true,
            start: 0,
            end: 100,
            height: 20,
            bottom: 10,
            borderColor: 'transparent',
            backgroundColor: 'rgba(79, 172, 254, 0.1)',
            fillerColor: 'rgba(79, 172, 254, 0.2)',
            handleStyle: {
              color: '#4facfe'
            },
            textStyle: {
              color: '#a0c8ff'
            }
          }
        ],
        xAxis: {
          type: 'category',
          data: dates,
          axisLine: {
            lineStyle: {
              color: '#4facfe'
            }
          },
          axisLabel: {
            color: '#a0c8ff',
            fontSize: 10,
            rotate: 45
          }
        },
        yAxis: {
          type: 'value',
          name: '告警次数',
          nameTextStyle: {
            color: '#a0c8ff'
          },
          axisLine: {
            lineStyle: {
              color: '#4facfe'
            }
          },
          axisLabel: {
            color: '#a0c8ff'
          },
          splitLine: {
            lineStyle: {
              color: 'rgba(79, 172, 254, 0.2)'
            }
          }
        },
        series: [
          {
            name: '告警次数',
            type: 'bar',
            data: alertCounts,
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#ff4d4d' },
                { offset: 1, color: '#ff9999' }
              ])
            },
            emphasis: {
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: '#ff3333' },
                  { offset: 1, color: '#ff6666' }
                ])
              }
            },
            markLine: {
              data: [
                {
                  type: 'average',
                  name: '平均值',
                  lineStyle: {
                    color: '#ffcc00',
                    type: 'dashed'
                  },
                  label: {
                    formatter: '平均: {c}',
                    color: '#ffcc00'
                  }
                }
              ]
            }
          }
        ]
      }
      
      alertHistoryChart.value.setOption(option, true)
    }
  }	

  // 新增：保存位置到本地存储
  const savePositionsToLocalStorage = () => {
    const saveData = {
      factoryPositions: factoryDevicePositions.value,
      timestamp: new Date().toISOString()
    }
    localStorage.setItem('factoryDevicePositions', JSON.stringify(saveData))
    console.log('设备位置已保存到本地存储:', saveData)
  }

  // 新增：从本地存储加载位置
  const loadPositionsFromLocalStorage = () => {
    try {
      const savedData = localStorage.getItem('factoryDevicePositions')
      if (savedData) {
        const parsedData = JSON.parse(savedData)
        if (parsedData.factoryPositions) {
          factoryDevicePositions.value = parsedData.factoryPositions
          console.log('从本地存储加载设备位置:', parsedData)
          return true
        }
      }
    } catch (error) {
      console.error('加载设备位置失败:', error)
    }
    return false
  }  

    // 修改 useMockTemperatureHistory 函数中的时间戳处理部分
    const useMockTemperatureHistory = (deviceId) => {
      const now = new Date()
      const timestamps = []
      const actual = []
      const predicted = []
      
      const intervalSeconds = parseInt(predictionInterval.value)
      const dataPoints = 10
      
      console.log(`生成虚拟数据，预测间隔: ${intervalSeconds}秒，数据点: ${dataPoints}`)
      
      // 生成实际温度数据 - 从过去到现在的连续时间点
      for (let i = dataPoints - 1; i >= 0; i--) {
        const time = new Date(now.getTime() - i * intervalSeconds * 1000)
        timestamps.push(time.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit',
          second: '2-digit'
        }))
        
        const baseTemp = selectedDevice.value?.temperature || 65
        // 生成更真实的温度变化，基于前一个温度
        let actualTemp
        if (i === dataPoints - 1) {
          // 第一个数据点
          actualTemp = baseTemp + Math.random() * 6 - 3
        } else {
          // 基于前一个温度，变化幅度较小
          const prevTemp = actual[actual.length - 1]
          actualTemp = prevTemp + (Math.random() * 2 - 1)
          // 限制温度范围在合理区间
          actualTemp = Math.max(50, Math.min(90, actualTemp))
        }
        actual.push(Number(actualTemp.toFixed(1)))
      }
      
      // 生成预测温度数据 - 时间延后intervalSeconds秒
      const predictedTimestamps = []
      for (let i = dataPoints - 1; i >= 0; i--) {
        const baseTime = new Date(now.getTime() - i * intervalSeconds * 1000)
        const predictedTime = new Date(baseTime.getTime() + intervalSeconds * 1000)
        predictedTimestamps.push(predictedTime.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit',
          second: '2-digit'
        }))
        
        // 预测温度基于对应的实际温度，加入趋势预测
        const correspondingActual = actual[actual.length - 1 - i]
        let predictedTemp
        
        if (i === dataPoints - 1) {
          // 第一个预测点基于第一个实际温度
          predictedTemp = correspondingActual + (Math.random() * 2 - 1)
        } else {
          // 基于实际温度趋势进行预测
          const trend = correspondingActual - actual[actual.length - 2 - i]
          predictedTemp = correspondingActual + trend * 0.8 + (Math.random() * 1.5 - 0.75)
        }
        
        // 限制预测温度范围
        predictedTemp = Math.max(50, Math.min(90, predictedTemp))
        predicted.push(Number(predictedTemp.toFixed(1)))
      }
      
      // 关键修改：确保时间戳正确对齐，预测温度始终延后
      const allTimestamps = [...timestamps, ...predictedTimestamps]
        .filter((timestamp, index, array) => array.indexOf(timestamp) === index) // 去重
        .sort((a, b) => {
          // 按时间排序
          const timeA = new Date(`1970/01/01 ${a}`).getTime()
          const timeB = new Date(`1970/01/01 ${b}`).getTime()
          return timeA - timeB
        })
      
      // 创建对齐的数据数组 - 确保预测温度始终在对应实际温度之后
      const alignedActual = allTimestamps.map(timestamp => {
        const index = timestamps.indexOf(timestamp)
        return index !== -1 ? actual[index] : null
      })
      
      const alignedPredicted = allTimestamps.map(timestamp => {
        const index = predictedTimestamps.indexOf(timestamp)
        return index !== -1 ? predicted[index] : null
      })
      
      temperatureHistory.value = {
        timestamps: allTimestamps,
        actual: alignedActual,
        predicted: alignedPredicted
      }
      
      console.log('生成的虚拟温度数据:', {
        timestamps: temperatureHistory.value.timestamps,
        actual: temperatureHistory.value.actual,
        predicted: temperatureHistory.value.predicted,
        predictionInterval: intervalSeconds
      })
      
      updatePredictionChartWithHistory()
    }
    
    // 使用历史数据更新预测图表
    const updatePredictionChartWithHistory = () => {
      if (predictionChart.value && temperatureHistory.value.timestamps.length > 0) {
        const { timestamps, actual, predicted } = temperatureHistory.value
        
        console.log('更新图表数据:', {
          timestamps,
          actual,
          predicted,
          predictionInterval: predictionInterval.value
        })
        
        const option = {
          tooltip: {
            trigger: 'axis',
            textStyle: {
              color: '#fff'
            },
            backgroundColor: 'rgba(16, 35, 70, 0.9)',
            borderColor: '#4facfe',
            formatter: function(params) {
              let result = `<div style="font-weight:bold;margin-bottom:5px;">${params[0].axisValue}</div>`
              params.forEach(param => {
                if (param.value !== null) {
                  const icon = param.seriesName === '实际温度' ? '🌡️' : '🔮'
                  const color = param.seriesName === '实际温度' ? '#00f2fe' : '#ffcc00'
                  result += `
                    <div style="display:flex;align-items:center;margin:2px 0;">
                      <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color};margin-right:5px;"></span>
                      ${icon} ${param.seriesName}: <span style="color:${color};font-weight:bold;margin-left:5px;">${param.value}°C</span>
                    </div>
                  `
                }
              })
              return result
            }
          },
          legend: {
            data: ['实际温度', '预测温度'],
            textStyle: {
              color: '#fff'
            },
            top: '2%',
          },
          grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            top: '15%',
            containLabel: true
          },
          xAxis: {
            type: 'category',
            boundaryGap: false,
            data: timestamps,
            axisLine: {
              lineStyle: {
                color: '#4facfe'
              }
            },
            axisLabel: {
              color: '#a0c8ff',
              fontSize: 10,
              rotate: 45,
              formatter: function(value, index) {
                if (!value) return ''
                
                // 处理时间字符串，确保格式统一
                let timeStr = value.toString()
                
                // 如果包含日期和时间，只取时间部分
                if (timeStr.includes(' ')) {
                  timeStr = timeStr.split(' ')[1] || timeStr
                }
                
                // 确保时间格式为 HH:MM:SS
                const timeParts = timeStr.split(':')
                if (timeParts.length === 1) {
                  // 只有小时
                  return `${timeParts[0]}:00:00`
                } else if (timeParts.length === 2) {
                  // 只有小时和分钟
                  return `${timeParts[0]}:${timeParts[1]}:00`
                } else if (timeParts.length === 3) {
                  // 完整的时间，直接返回
                  return timeStr
                }
                
                return timeStr
              }
            },
            axisTick: {
              alignWithLabel: true
            }
          },
          yAxis: {
            type: 'value',
            name: '温度 (°C)',
            nameTextStyle: {
              color: '#a0c8ff'
            },
            min: function(value) {
              const minVal = Math.min(
                ...actual.filter(v => v !== null),
                ...predicted.filter(v => v !== null)
              )
              return Math.max(0, Math.floor(minVal - 5))
            },
            max: function(value) {
              const maxVal = Math.max(
                ...actual.filter(v => v !== null),
                ...predicted.filter(v => v !== null)
              )
              return Math.ceil(maxVal + 5)
            },
            axisLine: {
              lineStyle: {
                color: '#4facfe'
              }
            },
            axisLabel: {
              color: '#a0c8ff',
              formatter: '{value}°C'
            },
            splitLine: {
              lineStyle: {
                color: 'rgba(79, 172, 254, 0.2)'
              }
            }
          },
          series: [
            {
              name: '实际温度',
              type: 'line',
              data: actual,
              smooth: true,
              lineStyle: {
                color: '#00f2fe',
                width: 3
              },
              symbol: 'circle',
              symbolSize: 6,
              itemStyle: {
                color: '#00f2fe'
              },
              areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: 'rgba(0, 242, 254, 0.3)' },
                  { offset: 1, color: 'rgba(0, 242, 254, 0.1)' }
                ])
              }
            },
            {
              name: '预测温度',
              type: 'line',
              data: predicted,
              smooth: true,
              lineStyle: {
                color: '#ffcc00',
                width: 3,
                type: 'dashed'
              },
              symbol: 'circle',
              symbolSize: 6,
              itemStyle: {
                color: '#ffcc00'
              }
            }
          ]
        }
        
        predictionChart.value.setOption(option, true)
      }
    }

   // 在 setup() 函数中添加获取设备摘要的方法
   const fetchDeviceSummary = async () => {
     try {
       const response = await fetch(`${API_CONFIG.BASE_URL}/device/summary`)
       if (response.ok) {
         const summaryData = await response.json()
         onlineDevices.value = summaryData.onlineCount || 0
         totalDevices.value = summaryData.totalCount || 0
       } else {
         console.error('获取设备摘要失败:', response.status)
         // 备用方案：从设备数据计算
         onlineDevices.value = devices.value.filter(d => d.isUploaded).length
         totalDevices.value = devices.value.length
       }
     } catch (error) {
       console.error('获取设备摘要错误:', error)
       // 备用方案
       onlineDevices.value = devices.value.filter(d => d.isUploaded).length
       totalDevices.value = devices.value.length
     }
   }

    // 创建固定虚假设备
    const createMockDevices = () => {
      const mockDevices = []
      for (let i = 1; i <= 10; i++) {
        const temp = Math.floor(Math.random() * 40) + 50
        const gridColumn = Math.floor((i-1) % 5) + 1
        const gridRow = Math.floor((i-1) / 5) + 1
        
        mockDevices.push({
          deviceId: `MOCK-${i.toString().padStart(4, '0')}`,
          sensorId: `MOCK-SENSOR-${i}`,
          sensorName: `虚拟温度传感器 ${i}`,
          temperature: temp,
          predictedTemp: temp + Math.floor(Math.random() * 10) - 5,
          humidity: Math.floor(Math.random() * 30) + 40,
          pressure: Math.floor(Math.random() * 200) + 1000,
          alarmTriggered: Math.random() > 0.7,
          alarmMessage: Math.random() > 0.7 ? '温度过高告警' : '',
          isUploaded: Math.random() > 0.2,
          location: `虚拟区域${Math.ceil(i/5)}-位置${(i-1)%5+1}`,
          onlineTime: '2023-06-15 08:30:00',
          lastMaintenance: '2023-08-10 14:20:00',
          status: temp < 70 ? 'normal' : temp < 85 ? 'warning' : 'danger',
          gridColumn: gridColumn,
          gridRow: gridRow,
          x: (gridColumn - 1),
          y: (gridRow - 1),
          z: (temp - 50) / 10,
          isMock: true // 标记为虚拟设备
        })
      }
      return mockDevices
    }

    // 从后端获取设备数据
    const fetchDeviceData = async () => {
      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SENSOR_LATEST}`)
        if (response.ok) {
          const sensorData = await response.json()
          console.log('从后端获取的真实设备数据:', sensorData)
          
          // 转换真实设备数据格式
          const formattedDevices = sensorData.map((data, index) => {
            const temp = data.temperature || Math.floor(Math.random() * 40) + 50
            const deviceId = data.deviceId || `REAL-${(index + 1).toString().padStart(4, '0')}`
            const gridColumn = Math.floor(index % 5) + 1
            const gridRow = Math.floor(index / 5) + 1
            
            return {
              deviceId: deviceId,
              sensorId: data.sensorId || `REAL-SENSOR-${index + 1}`,
              sensorName: data.sensorName || `真实温度传感器 ${index + 1}`,
              temperature: temp,
              predictedTemp: data.predictedTemperature || (temp + Math.floor(Math.random() * 10) - 5),
              humidity: data.humidity || Math.floor(Math.random() * 30) + 40,
              pressure: data.pressure || Math.floor(Math.random() * 200) + 1000,
              // 使用后端的告警触发状态和告警信息
              alarmTriggered: data.alarmTriggered || false,
              alarmMessage: data.alarmMessage || '',
              isUploaded: data.isUploaded !== undefined ? data.isUploaded : true,
              location: `真实区域${Math.ceil((index+1)/5)}-位置${(index)%5+1}`,
              onlineTime: '2023-06-15 08:30:00',
              lastMaintenance: '2023-08-10 14:20:00',
              status: temp < 70 ? 'normal' : temp < 85 ? 'warning' : 'danger',
              gridColumn: gridColumn,
              gridRow: gridRow,
              x: (gridColumn - 1),
              y: (gridRow - 1),
              z: (temp - 50) / 10,
              isMock: false, // 标记为真实设备
              isReal: true,   // 新增标记
              // 添加时间戳信息
              timestamp: data.timestamp || new Date().toISOString()
            }
          })
          
          // 创建虚拟设备
          const mockDevices = createMockDevices()
          
          // 合并设备，确保所有设备都有唯一ID
          const allDevices = [...mockDevices, ...formattedDevices]
          
          // 为所有设备分配唯一索引用于3D位置
          devices.value = allDevices.map((device, index) => ({
            ...device,
            displayIndex: index // 新增字段用于3D场景定位
          }))
          
          // 更新统计信息
          updateDeviceStatsFromAllDevices()

          // 选择默认设备
          if (devices.value.length > 0 && !selectedDevice.value) {
            selectedDevice.value = devices.value[0]
            updateDeviceScrollPosition()
            fetchTemperatureHistory(selectedDevice.value.deviceId)
            highlightSelectedDevice()
          }
          
          // 更新3D场景
          if (sceneContainer.value) {
            update3DSceneDevices()
          }
          
          // 更新告警数据 - 现在会根据 isUsingMockData 决定是否包含虚拟设备
          updateAlertsFromDeviceData()
          
          isUsingMockData.value = false
        } else {
          console.error('获取设备数据失败:', response.status)
          useMockDevicesOnly()
        }
      } catch (error) {
        console.error('获取设备数据错误:', error)
        isUsingMockData.value = true
        useMockDevicesOnly()
      }
    }
	
    // 仅使用虚拟设备
    const useMockDevicesOnly = () => {
      devices.value = createMockDevices()
      // 计算设备统计信息（包含虚拟设备）
      updateDeviceStatsFromAllDevices()
      
      // 如果有设备数据，选择第一个设备作为默认选中
      if (devices.value.length > 0 && !selectedDevice.value) {
        selectedDevice.value = devices.value[0]
        updateDeviceScrollPosition()
        updatePredictionChart()
        highlightSelectedDevice()
      }
      
      // 更新3D场景
      if (sceneContainer.value) {
        update3DSceneDevices()
      }
      
      // 更新告警数据 - 此时会包含虚拟设备的告警
      updateAlertsFromDeviceData()
      
      isUsingMockData.value = true
    }
	
	

    // 从设备数据更新告警
    const updateAlertsFromDeviceData = () => {
      // 清空原有告警
      recentAlerts.value = []
      
      devices.value.forEach(device => {
        if (isUsingMockData.value) {
          // 前后端未连接时：只使用虚拟设备的告警
          if (device.isMock) {
            if (device.alarmTriggered) {
              const alert = generateAlert(device, 'temperature_high', device.alarmMessage || `设备 ${device.deviceId} 触发告警`)
              addAlert(alert)
            }
            
            if (!device.isUploaded) {
              const alert = generateAlert(device, 'connection_lost', `设备 ${device.deviceId} 数据未上传`)
              addAlert(alert)
            }
          }
        } else {
          // 前后端连接时：只使用真实设备的告警
          if (!device.isMock) {
            if (device.alarmTriggered) {
              const alert = generateAlert(device, 'temperature_high', device.alarmMessage || `设备 ${device.deviceId} 触发告警`)
              addAlert(alert)
            }
            
            if (!device.isUploaded) {
              const alert = generateAlert(device, 'connection_lost', `设备 ${device.deviceId} 数据未上传`)
              addAlert(alert)
            }
          }
        }
      })
    }
    
    // 告警相关方法
    const generateAlert = (device, alertType, message) => {
      const alertId = Date.now() + Math.random()
      // 使用设备的时间戳，如果没有则使用当前时间
      const alertTime = device.timestamp ? 
        new Date(device.timestamp).toLocaleString() : 
        new Date().toLocaleString()
      
      let level = ALERT_LEVELS.INFO
      let alertMessage = message
      
      switch (alertType) {
        case 'temperature_high':
          level = device.temperature >= 85 ? ALERT_LEVELS.DANGER : ALERT_LEVELS.WARNING
          alertMessage = device.alarmMessage || `温度过高: ${device.temperature}°C`
          break
        case 'temperature_low':
          level = ALERT_LEVELS.WARNING
          alertMessage = `温度过低: ${device.temperature}°C`
          break
        case 'connection_lost':
          level = ALERT_LEVELS.DANGER
          alertMessage = '设备连接丢失'
          break
        case 'connection_restored':
          level = ALERT_LEVELS.INFO
          alertMessage = '设备通讯恢复'
          break
        case 'prediction_alert':
          level = ALERT_LEVELS.WARNING
          alertMessage = `预测温度异常: ${device.predictedTemp}°C`
          break
        case 'fluctuation':
          level = ALERT_LEVELS.WARNING
          alertMessage = '温度异常波动'
          break
        default:
          alertMessage = message || '设备状态异常'
      }
      
      return {
        id: alertId,
        time: alertTime,
        deviceId: device.deviceId,
        message: alertMessage,
        level: level,
        temperature: device.temperature,
        location: device.location,
        acknowledged: false,
        isRealDevice: !device.isMock // 标记是否为真实设备
      }
    }

    const addAlert = (alert) => {
      recentAlerts.value.unshift(alert)
      
      // 限制告警列表长度，最多保留50条
      if (recentAlerts.value.length > 50) {
        recentAlerts.value = recentAlerts.value.slice(0, 50)
      }
      
      // 如果是当前数据源类型的告警，自动滚动到最新告警
      const isCurrentDataSourceAlert = isUsingMockData.value ? !alert.isRealDevice : alert.isRealDevice
      if (isCurrentDataSourceAlert) {
        currentAlertIndex.value = 0
        updateAlertScrollPosition()
      }
      
      console.log('新告警:', alert)
    }

    const acknowledgeAlert = (alertId) => {
      const alert = recentAlerts.value.find(a => a.id === alertId)
      if (alert) {
        alert.acknowledged = true
      }
    }

    const getAlertStats = () => {
      const total = recentAlerts.value.length
      const unacknowledged = recentAlerts.value.filter(alert => !alert.acknowledged).length
      const dangerAlerts = recentAlerts.value.filter(alert => alert.level === ALERT_LEVELS.DANGER).length
      const warningAlerts = recentAlerts.value.filter(alert => alert.level === ALERT_LEVELS.WARNING).length
      
      return {
        total,
        unacknowledged,
        dangerAlerts,
        warningAlerts
      }
    }

    const detectTemperatureAlerts = (device, oldTemperature) => {
      const tempChange = Math.abs(device.temperature - oldTemperature)
      
      // 温度超过阈值告警
      if (device.temperature >= 85) {
        addAlert(generateAlert(device, 'temperature_high', `温度严重过高: ${device.temperature}°C`))
      } else if (device.temperature >= 80) {
        addAlert(generateAlert(device, 'temperature_high', `温度偏高: ${device.temperature}°C`))
      } else if (device.temperature <= 55) {
        addAlert(generateAlert(device, 'temperature_low', `温度偏低: ${device.temperature}°C`))
      }
      
      // 温度剧烈变化告警
      if (tempChange >= 8) {
        addAlert(generateAlert(device, 'fluctuation', `温度剧烈变化: ${oldTemperature}°C → ${device.temperature}°C`))
      }
      
      // 预测温度异常告警
      if (Math.abs(device.temperature - device.predictedTemp) >= 10) {
        addAlert(generateAlert(device, 'prediction_alert', `预测偏差过大: 实际${device.temperature}°C vs 预测${device.predictedTemp}°C`))
      }
    }

    const simulateConnectionIssues = () => {
      // 5%的概率模拟设备连接问题
      if (Math.random() < 0.05) {
        const randomDevice = devices.value[Math.floor(Math.random() * devices.value.length)]
        addAlert(generateAlert(randomDevice, 'connection_lost', '设备通讯中断'))
        
        // 临时标记设备为离线状态
        setTimeout(() => {
          const device = devices.value.find(d => d.deviceId === randomDevice.deviceId)
          if (device) {
            addAlert(generateAlert(device, 'connection_restored', '设备通讯恢复'))
          }
        }, 5000)
      }
    }

    const initAlerts = () => {
      // 清空原有示例数据
      recentAlerts.value = []
      
      // 根据当前数据源状态生成告警
      updateAlertsFromDeviceData()
    }

	// 3D可视化方法
    const init3DScene = () => {
      if (!sceneContainer.value) return

      // 清除现有画布
      const existingCanvas = sceneContainer.value.querySelector('canvas')
      if (existingCanvas) {
        sceneContainer.value.removeChild(existingCanvas)
      }

      // 创建画布
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      canvas.width = sceneContainer.value.clientWidth
      canvas.height = sceneContainer.value.clientHeight
      canvas.style.width = '100%'
      canvas.style.height = '100%'
      canvas.style.position = 'absolute'
      canvas.style.top = '0'
      canvas.style.left = '0'
      canvas.style.zIndex = '2'
      sceneContainer.value.appendChild(canvas)

      // 使用所有设备（真实+虚拟），但限制显示数量避免重叠
      const maxDisplayDevices = 15 // 最大显示设备数量
      const allDevices = devices.value.slice(0, maxDisplayDevices)
      
      const deviceData = allDevices.map((device, index) => {
        const positions = currentDevicePositions.value
        const pos = positions[index] || { 
          x: Math.random() * 800 + 100, 
          y: Math.random() * 600 + 100 
        }
        
        // 保存原始位置
        originalDevicePositions.value[device.deviceId] = { x: pos.x, y: pos.y }
        
        return {
          ...device,
          position: { 
            x: pos.x,
            y: pos.y,
            z: (device.temperature - 50) / 5
          },
          type: device.isMock ? 'sensor' : 'valve', // 虚拟设备显示为传感器，真实设备显示为阀门
          originalX: pos.x,
          originalY: pos.y,
          pulsePhase: Math.random() * Math.PI * 2,
          color: getDevice3DColor(device),
          radius: device.isMock ? 12 : 15, // 真实设备稍大一点
          isDragging: false
        }
      })

      sceneObjects = deviceData

      // 开始动画循环
      animate3D()

      loading3D.value = false
      console.log('3D场景初始化完成，显示设备:', sceneObjects.length)
      console.log('设备详情:', sceneObjects.map(d => ({
        deviceId: d.deviceId,
        isMock: d.isMock,
        isReal: d.isReal,
        position: d.position
      })))
    }

    const getDevice3DColor = (device) => {
      if (!device.isUploaded) return '#ff4d4d' // 红色 - 异常（未上传）
      if (device.alarmTriggered) return '#ffcc00' // 黄色 - 预警（触发告警）
      return '#00ff9d' // 绿色 - 正常
    }

    // 新增方法：更新3D场景设备数据
    const update3DSceneDevices = () => {
      sceneObjects.forEach(sceneDevice => {
        const device = devices.value.find(d => d.deviceId === sceneDevice.deviceId)
        if (device) {
          // 更新所有设备属性
          Object.assign(sceneDevice, {
            color: getDevice3DColor(device),
            temperature: device.temperature,
            alarmTriggered: device.alarmTriggered,
            isUploaded: device.isUploaded
          })
        }
      })
      
      // 如果当前有显示的提示框，更新其内容
      if (showTooltip.value && tooltipDevice.value) {
        const currentDevice = devices.value.find(d => d.deviceId === tooltipDevice.value.deviceId)
        if (currentDevice) {
          tooltipDevice.value = { ...currentDevice }
        }
      }
      
      // 强制重新渲染3D场景
      if (sceneContainer.value) {
        const canvas = sceneContainer.value.querySelector('canvas')
        if (canvas) {
          const ctx = canvas.getContext('2d')
          draw3DScene(ctx, canvas)
        }
      }
    }

    const project3DTo2D = (x, y, z) => {
      const scale = cameraDistance / (cameraDistance + z + cameraHeight)
      const projectedX = x * scale
      const projectedY = y * scale
      return { x: projectedX, y: projectedY, scale: scale }
    }

	const draw3DScene = (ctx, canvas) => {
	  ctx.clearRect(0, 0, canvas.width, canvas.height)
	  
	  // 检查是否有设备数据
	  if (sceneObjects.length === 0) {
		// 如果没有设备，显示提示信息
		ctx.fillStyle = '#a0c8ff'
		ctx.font = '16px Arial'
		ctx.textAlign = 'center'
		ctx.textBaseline = 'middle'
		ctx.fillText('正在加载设备数据...', canvas.width / 2, canvas.height / 2)
		return
	  }
	  
	  sceneObjects.forEach(device => {
		draw3DDevice(ctx, device, canvas)
	  })

	  draw3DConnections(ctx, canvas)
	}

    const draw3DDevice = (ctx, device, canvas) => {
      const projected = project3DTo2D(device.position.x, device.position.y, device.position.z)
      const { x, y, scale } = projected

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, device.radius * scale)
      gradient.addColorStop(0, device.color)
      gradient.addColorStop(1, darkenColor(device.color, 0.7))

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(x, y, device.radius * scale, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
      ctx.beginPath()
      ctx.arc(x - device.radius * scale * 0.3, y - device.radius * scale * 0.3, device.radius * scale * 0.4, 0, Math.PI * 2)
      ctx.fill()

      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2 * scale
      ctx.beginPath()
      ctx.arc(x, y, device.radius * scale, 0, Math.PI * 2)
      ctx.stroke()

      if (selectedDevice.value && selectedDevice.value.deviceId === device.deviceId) {
        const pulseSize = 3 + Math.sin(device.pulsePhase) * 2
        ctx.strokeStyle = '#ff00ff'
        ctx.lineWidth = 3 * scale
        ctx.beginPath()
        ctx.arc(x, y, (device.radius + pulseSize) * scale, 0, Math.PI * 2)
        ctx.stroke()

        ctx.strokeStyle = 'rgba(255, 0, 255, 0.5)'
        ctx.lineWidth = 2 * scale
        ctx.beginPath()
        ctx.arc(x, y, (device.radius + 8 + pulseSize * 2) * scale, 0, Math.PI * 2)
        ctx.stroke()
      }

      ctx.fillStyle = '#ffffff'
      ctx.font = `bold ${16 * scale}px Arial`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      
      let icon = '⚙️'
      if (device.type === 'valve') icon = '🔧'
      else if (device.type === 'sensor') icon = '📡'
      else if (device.type === 'pump') icon = '⚡'
      
      ctx.fillText(icon, x, y)

      ctx.fillStyle = '#a0c8ff'
      ctx.font = `${20 * scale}px Arial`
      ctx.fillText(device.deviceId, x, y + (device.radius + 15) * scale)

      // 确保温度文本使用最新的设备温度
      ctx.fillStyle = device.color
      ctx.font = `bold ${16 * scale}px Arial`
      ctx.fillText(`${device.temperature}°C`, x, y + (device.radius - 40) * scale)

      // 显示设备状态
      ctx.fillStyle = '#ffffff'
      ctx.font = `${12 * scale}px Arial`
      const statusText = !device.isUploaded ? '离线' : device.alarmTriggered ? '告警' : '正常'
      ctx.fillText(statusText, x, y + (device.radius + 35) * scale)
    }

    const draw3DConnections = (ctx, canvas) => {
      ctx.strokeStyle = 'rgba(79, 172, 254, 0.4)'
      ctx.lineWidth = 2
      ctx.setLineDash([3, 3])

      for (let i = 0; i < sceneObjects.length; i++) {
        for (let j = i + 1; j < sceneObjects.length; j++) {
          const device1 = sceneObjects[i]
          const device2 = sceneObjects[j]
          
          const dx = device1.position.x - device2.position.x
          const dy = device1.position.y - device2.position.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance < 200) {
            const projected1 = project3DTo2D(device1.position.x, device1.position.y, device1.position.z)
            const projected2 = project3DTo2D(device2.position.x, device2.position.y, device2.position.z)
            
            ctx.beginPath()
            ctx.moveTo(projected1.x, projected1.y)
            ctx.lineTo(projected2.x, projected2.y)
            ctx.stroke()
          }
        }
      }

      ctx.setLineDash([])
    }

    const darkenColor = (color, factor) => {
      const hex = color.replace('#', '')
      const num = parseInt(hex, 16)
      const amt = Math.round(2.55 * factor * 100)
      const R = (num >> 16) - amt
      const G = (num >> 8 & 0x00FF) - amt
      const B = (num & 0x0000FF) - amt
      return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
              (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
              (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1)
    }
    // 在 setup() 函数中添加
    const handleImageError = (event) => {
      console.error('工厂图片加载失败:', currentFactoryImage.value)
      console.log('图片元素:', event.target)
      // 可以设置一个默认背景色
      event.target.style.background = 'linear-gradient(45deg, #0a1a35, #1a3a6a)'
      event.target.style.display = 'flex'
      event.target.style.alignItems = 'center'
      event.target.style.justifyContent = 'center'
      event.target.innerHTML = '<div style="color: #a0c8ff; text-align: center;">图片加载失败</div>'
    }

    // 新增方法 - 显示设备提示信息
    const showDeviceTooltip = (device, event) => {
      tooltipDevice.value = device
      showTooltip.value = true
      
      // 计算提示框位置
      const rect = sceneContainer.value.getBoundingClientRect()
      tooltipStyle.left = (event.clientX - rect.left + 10) + 'px'
      tooltipStyle.top = (event.clientY - rect.top - 10) + 'px'
    }

    // 新增方法 - 隐藏设备提示信息
    const hideDeviceTooltip = () => {
      showTooltip.value = false
    }

    // 新增方法 - 处理鼠标移动事件
    const handle3DMouseMove = (event) => {
      const rect = sceneContainer.value.getBoundingClientRect()
      const mouseX = event.clientX - rect.left
      const mouseY = event.clientY - rect.top

      let hoveredDevice = null
      let minDistance = Infinity

      sceneObjects.forEach(device => {
        const projected = project3DTo2D(device.position.x, device.position.y, device.position.z)
        
        const dx = projected.x - mouseX
        const dy = projected.y - mouseY
        const distance = Math.sqrt(dx * dx + dy * dy)
        const hoverRadius = device.radius * projected.scale * 1.5 // 增加悬停半径

        if (distance <= hoverRadius && distance < minDistance) {
          minDistance = distance
          hoveredDevice = device
        }
      })

      if (hoveredDevice) {
        const foundDevice = devices.value.find(d => d.deviceId === hoveredDevice.deviceId)
        if (foundDevice) {
          // 实时更新设备数据
          tooltipDevice.value = { ...foundDevice }
          showTooltip.value = true
          
          // 计算提示框位置，确保在容器内完全显示
          const tooltipWidth = 180 // 简化后的宽度
          const tooltipHeight = 80 // 简化后的高度
          
          let left = event.clientX - rect.left + 15
          let top = event.clientY - rect.top - 10
          
          // 防止提示框超出右边界
          if (left + tooltipWidth > rect.width) {
            left = event.clientX - rect.left - tooltipWidth - 5
          }
          
          // 防止提示框超出下边界
          if (top + tooltipHeight > rect.height) {
            top = event.clientY - rect.top - tooltipHeight - 5
          }
          
          // 防止提示框超出上边界
          if (top < 0) {
            top = 10
          }
          
          tooltipStyle.left = left + 'px'
          tooltipStyle.top = top + 'px'
        }
      } else {
        hideDeviceTooltip()
      }
    }

    // 新增：工厂切换方法
    const nextFactory = () => {
      currentFactoryIndex.value = (currentFactoryIndex.value + 1) % factoryNames.value.length
      updateFactoryScene()
    }

    const prevFactory = () => {
      currentFactoryIndex.value = (currentFactoryIndex.value - 1 + factoryNames.value.length) % factoryNames.value.length
      updateFactoryScene()
    }

    const updateFactoryScene = () => {
       // 保存当前工厂的位置更改
      if (hasPositionChanges.value) {
        savePositionsToLocalStorage()
      }
  
      // 重新初始化3D场景
      init3DScene()
    }

    // 新增：设备拖动相关方法
    let isDragging = false
    let draggedDevice = null
    let dragOffsetX = 0
    let dragOffsetY = 0

    const handle3DMouseDown = (event) => {
      const rect = sceneContainer.value.getBoundingClientRect()
      const mouseX = event.clientX - rect.left
      const mouseY = event.clientY - rect.top

      let clickedDevice = null
      let minDistance = Infinity

      sceneObjects.forEach(device => {
        const projected = project3DTo2D(device.position.x, device.position.y, device.position.z)
        
        const dx = projected.x - mouseX
        const dy = projected.y - mouseY
        const distance = Math.sqrt(dx * dx + dy * dy)
        const clickRadius = device.radius * projected.scale

        if (distance <= clickRadius && distance < minDistance) {
          minDistance = distance
          clickedDevice = device
          dragOffsetX = projected.x - mouseX
          dragOffsetY = projected.y - mouseY
        }
      })

      if (clickedDevice) {
        isDragging = true
        draggedDevice = clickedDevice
        draggedDevice.isDragging = true
        
        // 点击设备时停止自动轮播
        autoCarouselEnabled.value = false
        
        const foundDevice = devices.value.find(d => d.deviceId === clickedDevice.deviceId)
        if (foundDevice) {
          selectedDevice.value = foundDevice
          updateDeviceScrollPosition()
          fetchTemperatureHistory(selectedDevice.value.deviceId)
          highlightSelectedDevice()
          
          // 如果提示框正在显示，也更新提示框内容
          if (showTooltip.value) {
            tooltipDevice.value = { ...foundDevice }
          }
        }
      } else {
        // 点击空白处时恢复自动轮播
        autoCarouselEnabled.value = true
      }
    }

    const handle3DMouseUp = () => {
      if (isDragging && draggedDevice) {
        draggedDevice.isDragging = false
        
        // 检查位置是否发生变化
        checkPositionChanges()
      }
      isDragging = false
      draggedDevice = null
    }

    const handle3DMouseDrag = (event) => {
      if (!isDragging || !draggedDevice) return

      const rect = sceneContainer.value.getBoundingClientRect()
      const mouseX = event.clientX - rect.left
      const mouseY = event.clientY - rect.top

      // 计算新的设备位置
      const projectedX = mouseX + dragOffsetX
      const projectedY = mouseY + dragOffsetY

      // 将2D坐标转换回3D坐标
      const scale = cameraDistance / (cameraDistance + draggedDevice.position.z + cameraHeight)
      const newX = projectedX / scale
      const newY = projectedY / scale

      // 更新设备位置 - 允许在整个容器内移动
      const containerWidth = 1179  // 工厂图片宽度
      const containerHeight = 1061 // 工厂图片高度
      draggedDevice.position.x = Math.max(0, Math.min(containerWidth, newX))
      draggedDevice.position.y = Math.max(0, Math.min(containerHeight, newY))
    }

    // 新增：检查位置变化
    const checkPositionChanges = () => {
      hasPositionChanges.value = false
      sceneObjects.forEach(device => {
        const originalPos = originalDevicePositions.value[device.deviceId]
        if (originalPos) {
          const currentX = Math.round(device.position.x)
          const currentY = Math.round(device.position.y)
          const originalX = Math.round(originalPos.x)
          const originalY = Math.round(originalPos.y)
          
          if (currentX !== originalX || currentY !== originalY) {
            hasPositionChanges.value = true
          }
        }
      })
    }

  // 新增：保存设备位置到本地存储
  const saveDevicePositions = () => {
    if (!hasPositionChanges.value) return
    
    // 更新原始位置记录
    sceneObjects.forEach(device => {
      originalDevicePositions.value[device.deviceId] = {
        x: device.position.x,
        y: device.position.y
      }
      
      // 更新工厂设备位置配置
      const deviceIndex = sceneObjects.findIndex(d => d.deviceId === device.deviceId)
      if (deviceIndex !== -1) {
        factoryDevicePositions.value[currentFactoryIndex.value][deviceIndex] = {
          x: device.position.x,
          y: device.position.y
        }
      }
    })
    
    // 保存到 localStorage
    savePositionsToLocalStorage()
    
    hasPositionChanges.value = false
    
    // 显示保存成功提示
    console.log('设备位置已保存到本地存储')
    alert('设备位置已成功保存！')
  }

    const handle3DDeviceClick = (event) => {
      // 现在点击事件由mousedown处理
    }

    const animate3D = () => {
      if (!sceneContainer.value) return

      const canvas = sceneContainer.value.querySelector('canvas')
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      draw3DScene(ctx, canvas)

      if (autoRotate.value) {
        sceneObjects.forEach(device => {
          device.pulsePhase += 0.1
        })
      }

      animationId = requestAnimationFrame(animate3D)
    }

    const toggleAutoRotate = () => {
      autoRotate.value = !autoRotate.value
    }

    const resetCamera = () => {
      cameraAngle = 0
      cameraDistance = 300
      cameraHeight = 200
    }

    // 设备详情面板相关方法
    const showDeviceDetailPanel = () => {
      showDetailPanel.value = true
      nextTick(() => {
        initTemperatureTrendChart()
        initAlertHistoryChart()
        if (selectedDevice.value) {
              fetchAlertHistory(selectedDevice.value.deviceId)
            }        
      })
    }

    const closeDeviceDetailPanel = () => {
      showDetailPanel.value = false
    }

    const initTemperatureTrendChart = () => {
      if (temperatureTrendChartRef.value) {
        temperatureTrendChart.value = echarts.init(temperatureTrendChartRef.value)
        
        // 模拟温度趋势数据
        const timestamps = []
        const temperatures = []
        const now = new Date()
        
        // 生成过去24小时的数据
        for (let i = 23; i >= 0; i--) {
          const time = new Date(now.getTime() - i * 60 * 60 * 1000)
          timestamps.push(time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}))
          
          const baseTemp = selectedDevice.value?.temperature || 65
          const temp = baseTemp + Math.random() * 8 - 4
          temperatures.push(Number(temp.toFixed(1)))
        }
        
        const option = {
          tooltip: {
            trigger: 'axis',
            textStyle: {
              color: '#fff'
            },
            backgroundColor: 'rgba(16, 35, 70, 0.9)',
            borderColor: '#4facfe'
          },
          grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            top: '10%',
            containLabel: true
          },
          xAxis: {
            type: 'category',
            data: timestamps,
            axisLine: {
              lineStyle: {
                color: '#4facfe'
              }
            },
            axisLabel: {
              color: '#a0c8ff',
              fontSize: 10,
              rotate: 45
            }
          },
          yAxis: {
            type: 'value',
            name: '温度 (°C)',
            nameTextStyle: {
              color: '#a0c8ff'
            },
            axisLine: {
              lineStyle: {
                color: '#4facfe'
              }
            },
            axisLabel: {
              color: '#a0c8ff',
              formatter: '{value}°C'
            },
            splitLine: {
              lineStyle: {
                color: 'rgba(79, 172, 254, 0.2)'
              }
            }
          },
          series: [
            {
              name: '温度',
              type: 'line',
              data: temperatures,
              smooth: true,
              lineStyle: {
                color: '#00f2fe',
                width: 2
              },
              symbol: 'circle',
              symbolSize: 4,
              itemStyle: {
                color: '#00f2fe'
              },
              areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: 'rgba(0, 242, 254, 0.3)' },
                  { offset: 1, color: 'rgba(0, 242, 254, 0.1)' }
                ])
              }
            }
          ]
        }
        
        temperatureTrendChart.value.setOption(option)
      }
    }

    const initAlertHistoryChart = () => {
      if (alertHistoryChartRef.value) {
        alertHistoryChart.value = echarts.init(alertHistoryChartRef.value)
        
        // 模拟告警历史数据
        const { dates, alertCounts } = generateMockAlertHistory()
        
        const option = {
          tooltip: {
            trigger: 'axis',
            textStyle: {
              color: '#fff'
            },
            backgroundColor: 'rgba(16, 35, 70, 0.9)',
            borderColor: '#4facfe'
          },
          grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            top: '10%',
            containLabel: true
          },
          dataZoom: [
            {
              type: 'inside',
              start: 0,
              end: 100
            },
            {
              type: 'slider',
              show: true,
              start: 0,
              end: 100,
              height: 20,
              bottom: 10,
              borderColor: 'transparent',
              backgroundColor: 'rgba(79, 172, 254, 0.1)',
              fillerColor: 'rgba(79, 172, 254, 0.2)',
              handleStyle: {
                color: '#4facfe'
              },
              textStyle: {
                color: '#a0c8ff'
              }
            }
          ],
          xAxis: {
            type: 'category',
            data: dates,
            axisLine: {
              lineStyle: {
                color: '#4facfe'
              }
            },
            axisLabel: {
              color: '#a0c8ff',
              fontSize: 10,
              rotate: 45
            }
          },
          yAxis: {
            type: 'value',
            name: '告警次数',
            nameTextStyle: {
              color: '#a0c8ff'
            },
            axisLine: {
              lineStyle: {
                color: '#4facfe'
              }
            },
            axisLabel: {
              color: '#a0c8ff'
            },
            splitLine: {
              lineStyle: {
                color: 'rgba(79, 172, 254, 0.2)'
              }
            }
          },
          series: [
            {
              name: '告警次数',
              type: 'bar',
              data: alertCounts,
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: '#ff4d4d' },
                  { offset: 1, color: '#ff9999' }
                ])
              },
              emphasis: {
                itemStyle: {
                  color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: '#ff3333' },
                    { offset: 1, color: '#ff6666' }
                  ])
                }
              }
            }
          ]
        }
        
        alertHistoryChart.value.setOption(option)
      }
    }

    const generateMockAlertHistory = () => {
      const dates = []
      const alertCounts = []
      const now = new Date()
      
      // 根据选择的时间范围生成数据
      let days = 7
      if (selectedTimeRange.value === 'month') days = 30
      else if (selectedTimeRange.value === 'quarter') days = 90
      else if (selectedTimeRange.value === 'year') days = 365
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        dates.push(date.toLocaleDateString())
        
        // 模拟告警次数，有设备告警时次数更多
        const hasAlert = selectedDevice.value && selectedDevice.value.alarmTriggered
        const baseCount = hasAlert ? Math.floor(Math.random() * 5) + 1 : Math.floor(Math.random() * 2)
        alertCounts.push(baseCount)
      }
      
      return { dates, alertCounts }
    }

    const changeTimeRange = async (range) => {
      selectedTimeRange.value = range
      if (selectedDevice.value) {
        await fetchAlertHistory(selectedDevice.value.deviceId)
      }
      updateAlertHistoryChart()
    }

    // 原有方法
    const updateTime = () => {
      currentTime.value = new Date().toLocaleString()
    }
    
    const selectRandomDevice = () => {
      if (devices.value.length > 0) {
        const randomIndex = Math.floor(Math.random() * devices.value.length)
        selectedDevice.value = devices.value[randomIndex]
        
        // 自动滚动到选中的设备
        nextTick(() => {
          const container = document.querySelector('.status-overview-container')
          const selectedElement = document.querySelector('.status-item.active')
          if (container && selectedElement) {
            selectedElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            })
          }
        })
        
        fetchTemperatureHistory(selectedDevice.value.deviceId)
        highlightSelectedDevice()
      }
    }
    
    const updateDeviceScrollPosition = () => {
      if (selectedDevice.value) {
        const deviceIndex = devices.value.findIndex(d => d.deviceId === selectedDevice.value.deviceId)
        const itemHeight = 40
        const visibleItems = 4
        const maxScroll = Math.max(0, (devices.value.length - visibleItems) * itemHeight)
        deviceScrollOffset.value = Math.min(deviceIndex * itemHeight, maxScroll)
      }
    }
    
    const updateAlertScrollPosition = () => {
      // 获取当前应该显示的告警（根据数据源类型）
      const validAlerts = recentAlerts.value.filter(alert => {
        if (isUsingMockData.value) {
          return !alert.isRealDevice
        } else {
          return alert.isRealDevice
        }
      })
      
      if (validAlerts.length > 0) {
        const itemHeight = 60
        const visibleItems = 3
        const maxScroll = Math.max(0, (validAlerts.length - visibleItems) * itemHeight)
        
        // 计算在有效告警列表中的索引
        const currentValidAlert = recentAlerts.value[currentAlertIndex.value]
        const validIndex = validAlerts.findIndex(alert => alert.id === currentValidAlert?.id)
        
        if (validIndex !== -1) {
          alertScrollOffset.value = Math.min(validIndex * itemHeight, maxScroll)
        }
      }
    }

    const startDeviceCarousel = () => {
      deviceCarouselInterval.value = setInterval(() => {
        // 只有启用自动轮播时才执行
        if (autoCarouselEnabled.value) {
          selectRandomDevice()
        }
      }, 3000)
    }
    
    const startAlertCarousel = () => {
      alertCarouselInterval.value = setInterval(() => {
        // 获取当前应该显示的告警（根据数据源类型）
        const validAlerts = recentAlerts.value.filter(alert => {
          if (isUsingMockData.value) {
            return !alert.isRealDevice // 模拟数据时只轮播虚拟设备告警
          } else {
            return alert.isRealDevice // 真实数据时只轮播真实设备告警
          }
        })
        
        if (validAlerts.length > 0) {
          // 在有效告警范围内轮播
          currentAlertIndex.value = (currentAlertIndex.value + 1) % validAlerts.length
          const currentValidAlert = validAlerts[currentAlertIndex.value]
          
          // 找到当前有效告警在完整告警列表中的索引
          const fullIndex = recentAlerts.value.findIndex(alert => alert.id === currentValidAlert.id)
          if (fullIndex !== -1) {
            currentAlertIndex.value = fullIndex
            updateAlertScrollPosition()
          }
        }
      }, 2000)
    }
    
    const highlightSelectedDevice = () => {
      if (surface3dChart.value && selectedDevice.value) {
        const option = surface3dChart.value.getOption()
        
        const deviceData = devices.value.map(device => {
          let color
          if (!device.isUploaded) {
            color = '#ff4d4d' // 红色 - 异常
          } else if (device.alarmTriggered) {
            color = '#ffcc00' // 黄色 - 预警
          } else {
            color = '#00ff9d' // 绿色 - 正常
          }
          
          const surfaceZ = 2 * Math.sin(device.x / 4 * Math.PI) * Math.cos(device.y / 1 * Math.PI)
          const finalZ = surfaceZ + device.z
          
          if (device.deviceId === selectedDevice.value.deviceId) {
            return {
              value: [device.x, device.y, finalZ],
              name: device.deviceId,
              temperature: device.temperature,
              itemStyle: {
                color: '#ff00ff',
                opacity: 1
              },
              symbolSize: 20,
              symbol: 'circle'
            }
          }
          
          return {
            value: [device.x, device.y, finalZ],
            name: device.deviceId,
            temperature: device.temperature,
            itemStyle: {
              color: color,
              opacity: 0.8
            },
            symbolSize: 8
          }
        })
        
        option.series[1].data = deviceData
        surface3dChart.value.setOption(option)
      }
    }
    
    const updatePredictionChart = () => {
      if (predictionChart.value && selectedDevice.value) {
        const option = predictionChart.value.getOption()
        
        const baseTemp = selectedDevice.value.temperature
        const actualData = []
        const predictedData = []
        
        for (let i = 0; i < 7; i++) {
          const actualTemp = baseTemp + Math.floor(Math.random() * 8) - 4
          const predictedTemp = baseTemp + Math.floor(Math.random() * 10) - 5
          actualData.push(actualTemp)
          predictedData.push(predictedTemp)
        }
        
        option.series[0].data = actualData
        option.series[1].data = predictedData
        predictionChart.value.setOption(option)
      }
    }
    
    const initCharts = () => {
      console.log('初始化图表...')
      
      if (predictionChartRef.value) {
        predictionChart.value = echarts.init(predictionChartRef.value)
        const predictionOption = getPredictionOption()
        predictionChart.value.setOption(predictionOption)
        console.log('温度趋势预测图表初始化完成')
      }
      
      initSurface3dChart()
      initGaugeCharts()
    }
    
    const initSurface3dChart = () => {
      if (surface3dChartRef.value) {
        surface3dChart.value = echarts.init(surface3dChartRef.value)
        const surface3dOption = getSurface3dOption()
        surface3dChart.value.setOption(surface3dOption)
        console.log('3D曲面图初始化完成')
      }
    }
    
    const getSurface3dOption = () => {
      const deviceData = devices.value.map(device => {
        let color
        if (!device.isUploaded) {
          color = '#ff4d4d' // 红色 - 异常
        } else if (device.alarmTriggered) {
          color = '#ffcc00' // 黄色 - 预警
        } else {
          color = '#00ff9d' // 绿色 - 正常
        }
        
        const surfaceZ = 2 * Math.sin(device.x / 4 * Math.PI) * Math.cos(device.y / 1 * Math.PI)
        const finalZ = surfaceZ + device.z
        
        return {
          value: [device.x, device.y, finalZ],
          name: device.deviceId,
          temperature: device.temperature,
          itemStyle: {
            color: color,
            opacity: 0.8
          },
          symbolSize: 8
        }
      })
      
      return {
        tooltip: {
          show: false
        },
        visualMap: {
          show: true,
          dimension: 2,
          min: 0,
          max: 5,
          inRange: {
            color: ['#00ff9d', '#ffcc00', '#ff4d4d']
          },
          textStyle: {
            color: '#fff'
          }
        },
        xAxis3D: {
          type: 'value',
          min: 0,
          max: 4,
          name: 'X轴',
          nameTextStyle: {
            color: '#a0c8ff'
          },
          axisLine: {
            lineStyle: {
              color: '#4facfe'
            }
          },
          axisLabel: {
            textStyle: {
              color: '#a0c8ff'
            }
          },
          splitLine: {
            lineStyle: {
              color: 'rgba(79, 172, 254, 0.2)'
            }
          }
        },
        yAxis3D: {
          type: 'value',
          min: 0,
          max: 1,
          name: 'Y轴',
          nameTextStyle: {
            color: '#a0c8ff'
          },
          axisLine: {
            lineStyle: {
              color: '#4facfe'
            }
          },
          axisLabel: {
            textStyle: {
              color: '#a0c8ff'
            }
          },
          splitLine: {
            lineStyle: {
              color: 'rgba(79, 172, 254, 0.2)'
            }
          }
        },
        zAxis3D: {
          type: 'value',
          min: -2,
          max: 5,
          name: '温度',
          nameTextStyle: {
            color: '#a0c8ff'
          },
          axisLine: {
            lineStyle: {
              color: '#4facfe'
            }
          },
          axisLabel: {
            textStyle: {
              color: '#a0c8ff'
            }
          },
          splitLine: {
            lineStyle: {
              color: 'rgba(79, 172, 254, 0.2)'
            }
          }
        },
        grid3D: {
          boxWidth: 100,
          boxDepth: 80,
          boxHeight: 60,
          environment: '#0a1a35',
          viewControl: {
            autoRotate: true,
            autoRotateSpeed: 5,
            distance: 120,
            beta: 40,
            alpha: 30
          },
          light: {
            main: {
              intensity: 1.5,
              shadow: false
            },
            ambient: {
              intensity: 0.7
            }
          }
        },
        series: [
          {
            type: 'surface',
            wireframe: {
              show: true,
              lineStyle: {
                color: 'rgba(79, 172, 254, 0.6)',
                width: 1
              }
            },
            itemStyle: {
              color: 'rgba(79, 172, 254, 0.1)',
              opacity: 0.8
            },
            parametric: true,
            parametricEquation: {
              u: {
                min: 0,
                max: Math.PI
              },
              v: {
                min: 0,
                max: Math.PI
              },
              x: function (u, v) {
                return 4 * u / Math.PI
              },
              y: function (u, v) {
                return 1 * v / Math.PI
              },
              z: function (u, v) {
                return 2 * Math.sin(u) * Math.cos(v)
              }
            }
          },
          {
            type: 'scatter3D',
            symbol: 'circle',
            data: deviceData,
            itemStyle: {
              opacity: 0.8
            }
          }
        ]
      }
    }
    
    const getPredictionOption = () => {
      return {
        tooltip: {
          trigger: 'axis',
          textStyle: {
            color: '#fff'
          },
          backgroundColor: 'rgba(16, 35, 70, 0.9)',
          borderColor: '#4facfe'
        },
        legend: {
          data: ['实际温度', '预测温度'],
          textStyle: {
            color: '#fff'
          },
          top: '2%',
        },
        grid: {
          left: '0%',
          right: '8%',
          bottom: '5%',
          top: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: ['10:30', '10:35', '10:40', '10:45', '10:50', '10:55', '11:00'],
          axisLine: {
            lineStyle: {
              color: '#4facfe'
            }
          },
          axisLabel: {
            color: '#a0c8ff'
          }
        },
        yAxis: {
          type: 'value',
          axisLine: {
            lineStyle: {
              color: '#4facfe'
            }
          },
          axisLabel: {
            color: '#a0c8ff'
          },
          splitLine: {
            lineStyle: {
              color: 'rgba(79, 172, 254, 0.2)'
            }
          }
        },
        series: [
          {
            name: '实际温度',
            type: 'line',
            data: [65, 68, 70, 72, 71, 69, 67],
            lineStyle: {
              color: '#00f2fe',
              width: 2
            },
            symbol: 'circle',
            symbolSize: 6,
            itemStyle: {
              color: '#00f2fe'
            }
          },
          {
            name: '预测温度',
            type: 'line',
            data: [65, 67, 69, 72, 70, 68, 66],
            lineStyle: {
              color: '#ffcc00',
              width: 2,
              type: 'dashed'
            },
            symbol: 'circle',
            symbolSize: 6,
            itemStyle: {
              color: '#ffcc00'
            }
          }
        ]
      }
    }
    
    const initGaugeCharts = () => {
      if (gaugeChartNormalRef.value) {
        gaugeChartNormal.value = echarts.init(gaugeChartNormalRef.value)
        const gaugeOptionNormal = {
          series: [
            {
              type: 'gauge',
              radius: '100%',
              center: ['50%', '50%'],
              startAngle: 180,
              endAngle: 0,
              min: 0,
              max: 100,
              splitNumber: 10,
              itemStyle: {
                color: '#00ff9d'
              },
              progress: {
                show: true,
                width: 15,
                roundCap: true
              },
              pointer: {
                show: false
              },
              axisLine: {
                roundCap: true,
                lineStyle: {
                  width: 15,
                  color: [[1, 'rgba(0, 255, 157, 0.2)']]
                }
              },
              axisTick: {
                show: false
              },
              splitLine: {
                show: false
              },
              axisLabel: {
                show: false
              },
              title: {
                show: false
              },
              detail: {
                show: false
              },
              data: [
                {
                  value: normalPercentage.value
                }
              ]
            }
          ]
        }
        gaugeChartNormal.value.setOption(gaugeOptionNormal)
      }
      
      if (gaugeChartWarningRef.value) {
        gaugeChartWarning.value = echarts.init(gaugeChartWarningRef.value)
        const gaugeOptionWarning = {
          series: [
            {
              type: 'gauge',
              radius: '100%',
              center: ['50%', '50%'],
              startAngle: 180,
              endAngle: 0,
              min: 0,
              max: 100,
              splitNumber: 10,
              itemStyle: {
                color: '#ffcc00'
              },
              progress: {
                show: true,
                width: 15,
                roundCap: true
              },
              pointer: {
                show: false
              },
              axisLine: {
                roundCap: true,
                lineStyle: {
                  width: 15,
                  color: [[1, 'rgba(255, 204, 0, 0.2)']]
                }
              },
              axisTick: {
                show: false
              },
              splitLine: {
                show: false
              },
              axisLabel: {
                show: false
              },
              title: {
                show: false
              },
              detail: {
                show: false
              },
              data: [
                {
                  value: warningPercentage.value
                }
              ]
            }
          ]
        }
        gaugeChartWarning.value.setOption(gaugeOptionWarning)
      }
      
      if (gaugeChartDangerRef.value) {
        gaugeChartDanger.value = echarts.init(gaugeChartDangerRef.value)
        const gaugeOptionDanger = {
          series: [
            {
              type: 'gauge',
              radius: '100%',
              center: ['50%', '50%'],
              startAngle: 180,
              endAngle: 0,
              min: 0,
              max: 100,
              splitNumber: 10,
              itemStyle: {
                color: '#ff4d4d'
              },
              progress: {
                show: true,
                width: 15,
                roundCap: true
              },
              pointer: {
                show: false
              },
              axisLine: {
                roundCap: true,
                lineStyle: {
                  width: 15,
                  color: [[1, 'rgba(255, 77, 77, 0.2)']]
                }
              },
              axisTick: {
                show: false
              },
              splitLine: {
                show: false
              },
              axisLabel: {
                show: false
              },
              title: {
                show: false
              },
              detail: {
                show: false
              },
              data: [
                {
                  value: dangerPercentage.value
                }
              ]
            }
          ]
        }
        gaugeChartDanger.value.setOption(gaugeOptionDanger)
      }
    }
    
  const updateDeviceData = () => {
    // 从后端获取最新数据
    fetchDeviceData()
    fetchDeviceSummary()
    
    lastUpdate.value = new Date().toLocaleTimeString()
    
    // 更新3D场景中的设备颜色和位置
    update3DSceneDevices()
    
    // 关键修改：每次数据更新时都重新生成告警
    updateAlertsFromDeviceData()
    
    if (surface3dChart.value) {
      highlightSelectedDevice()
    }
    
    updateGaugeCharts()
    updatePredictionChart()
  }
    
    const updateGaugeCharts = () => {
      // 重新计算百分比
      const total = devices.value.length
      const normalPercent = total > 0 ? Math.round((normalDevices.value / total) * 100) : 0
      const warningPercent = total > 0 ? Math.round((warningDevices.value / total) * 100) : 0
      const dangerPercent = total > 0 ? Math.round((dangerDevices.value / total) * 100) : 0
      
      if (gaugeChartNormal.value) {
        const option = gaugeChartNormal.value.getOption()
        option.series[0].data[0].value = normalPercent
        gaugeChartNormal.value.setOption(option)
      }
      
      if (gaugeChartWarning.value) {
        const option = gaugeChartWarning.value.getOption()
        option.series[0].data[0].value = warningPercent
        gaugeChartWarning.value.setOption(option)
      }
      
      if (gaugeChartDanger.value) {
        const option = gaugeChartDanger.value.getOption()
        option.series[0].data[0].value = dangerPercent
        gaugeChartDanger.value.setOption(option)
      }
    }
    
    const updateNetworkDelay = () => {
      networkDelay.value = Math.floor(Math.random() * 30) + 20
    }
    
    const getTempClass = (temp) => {
      if (temp < 70) return 'stat-normal'
      if (temp < 85) return 'stat-warning'
      return 'stat-danger'
    }
    
    const getTempStatus = (temp) => {
      if (temp < 70) return '正常'
      if (temp < 85) return '预警'
      return '异常'
    }
    
    const handleResize = () => {
      const charts = [
        predictionChart.value,
        surface3dChart.value,
        gaugeChartNormal.value,
        gaugeChartWarning.value,
        gaugeChartDanger.value,
        temperatureTrendChart.value,
        alertHistoryChart.value
      ]
      
      charts.forEach(chart => {
        if (chart) {
          chart.resize()
        }
      })
      
      if (sceneContainer.value) {
        const canvas = sceneContainer.value.querySelector('canvas')
        if (canvas) {
          canvas.width = sceneContainer.value.clientWidth
          canvas.height = sceneContainer.value.clientHeight
        }
      }
    }

    // 生命周期
    onMounted(() => {
      updateTime()
      setInterval(updateTime, 1000)
      
      // 首先尝试从本地存储加载设备位置
      loadPositionsFromLocalStorage()
      // 初始化虚拟设备
      useMockDevicesOnly()
      
      // 从后端获取设备数据（如果有后端连接）
	  fetchDeviceData().then(() => {
		// 设备数据加载完成后初始化3D场景
		nextTick(() => {
		  setTimeout(() => {
			initCharts()
			init3DScene()
			if (sceneContainer.value) {
			  sceneContainer.value.addEventListener('mousedown', handle3DMouseDown)
			  sceneContainer.value.addEventListener('mousemove', (e) => {
				handle3DMouseMove(e)
				handle3DMouseDrag(e)
			  })
			  sceneContainer.value.addEventListener('mouseup', handle3DMouseUp)
			  sceneContainer.value.addEventListener('mouseleave', () => {
				hideDeviceTooltip()
				handle3DMouseUp()
			  })
			}
		  }, 500)
		})
	  })
      initAlerts() // 初始化告警数据
      startDeviceCarousel()
      startAlertCarousel()
      
	  // 获取设备状态统计
	  fetchDeviceStatusSummary()
	  
      nextTick(() => {
        setTimeout(() => {
          initCharts()
          init3DScene()
          if (sceneContainer.value) {
            sceneContainer.value.addEventListener('mousedown', handle3DMouseDown)
            sceneContainer.value.addEventListener('mousemove', (e) => {
              handle3DMouseMove(e)
              handle3DMouseDrag(e)
            })
            sceneContainer.value.addEventListener('mouseup', handle3DMouseUp)
            sceneContainer.value.addEventListener('mouseleave', () => {
              hideDeviceTooltip()
              handle3DMouseUp()
            })
          }
        }, 500)
      })
      
      setInterval(updateDeviceData, 3000)
      setInterval(updateNetworkDelay, 5000)
      // 设置定时更新设备状态统计（每5秒更新一次）
      setInterval(fetchDeviceStatusSummary, 5000)
	  
      lastUpdate.value = new Date().toLocaleTimeString()
      
      window.addEventListener('resize', handleResize)
    })

    onBeforeUnmount(() => {
      // 在页面卸载前保存位置
      if (hasPositionChanges.value) {
        savePositionsToLocalStorage()
        console.log('页面卸载前自动保存设备位置')
      }      
      
      const charts = [
        predictionChart.value,
        surface3dChart.value,
        gaugeChartNormal.value,
        gaugeChartWarning.value,
        gaugeChartDanger.value,
        temperatureTrendChart.value,
        alertHistoryChart.value
      ]
      
      charts.forEach(chart => {
        if (chart) {
          chart.dispose()
        }
      })
      
      if (deviceCarouselInterval.value) {
        clearInterval(deviceCarouselInterval.value)
      }
      
      if (alertCarouselInterval.value) {
        clearInterval(alertCarouselInterval.value)
      }
      
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
      
      if (sceneContainer.value) {
        sceneContainer.value.removeEventListener('mousedown', handle3DMouseDown)
        sceneContainer.value.removeEventListener('mousemove', handle3DMouseMove)
        sceneContainer.value.removeEventListener('mouseup', handle3DMouseUp)
        sceneContainer.value.removeEventListener('mouseleave', hideDeviceTooltip)
      }
      
      window.removeEventListener('resize', handleResize)
    })

    return {
      currentTime,
      devices,
      selectedDevice,
      recentAlerts,
      networkDelay,
      lastUpdate,
      onlineDevices,
      totalDevices,
      currentAlert,
      deviceScrollOffset,
      alertScrollOffset,
      normalDevices,
      warningDevices,
      dangerDevices,
      normalPercentage,
      warningPercentage,
      dangerPercentage,
      getTempClass,
      getTempStatus,
      gaugeChartNormalRef,
      gaugeChartWarningRef,
      gaugeChartDangerRef,
      predictionChartRef,
      surface3dChartRef,
      sceneContainer,
      loading3D,
      autoRotate,
      deviceCount,
      isUsingMockData,
      toggleAutoRotate,
      resetCamera,
      acknowledgeAlert,
      getAlertStats,
	  deviceStats,
	  fetchDeviceStatusSummary,
      // 新增的返回数据
      temperatureHistory,
      historyLoading,
      fetchTemperatureHistory,
      // 设备提示框相关
      showTooltip,
      tooltipDevice,
      tooltipStyle,
      // 设备详情面板相关
      showDetailPanel,
      showDeviceDetailPanel,
      closeDeviceDetailPanel,
      temperatureTrendChartRef,
      alertHistoryChartRef,
      timeRanges,
      selectedTimeRange,
      changeTimeRange,
      alertHistoryData,
      alertHistoryLoading,
      fetchAlertHistory,
      autoCarouselEnabled,
      predictionInterval,
      onPredictionIntervalChange,
      // 新增：工厂切换相关
      currentFactoryIndex,
      factoryNames,
      currentFactoryImage,
      nextFactory,
      prevFactory,
      // 新增：设备位置保存相关
      hasPositionChanges,
      saveDevicePositions,
      pauseAlertCarousel,
      resumeAlertCarousel
    }
  }
}
</script>

<style scoped>
/* 样式部分保持不变，与之前相同 */
/* 设置根字体大小，基于屏幕宽度 */
:root {
  font-size: 14px; /* 设置基准字体大小 */
}

/* 告警模块样式 */
.alert-stats {
  display: flex;
  gap: 0.8rem;
  margin-left: auto;
  font-size: 0.8rem;
}

.stat-danger {
  color: #ff4d4d;
  font-weight: bold;
}

.stat-warning {
  color: #ffcc00;
  font-weight: bold;
}

.no-alerts {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 6rem;
  color: #a0c8ff;
}

.no-alerts-icon {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.no-alerts-text {
  font-size: 0.9rem;
}

.alert-item {
  display: flex;
  flex-direction: column;
  padding: 0.5rem;
  border-radius: 0.4rem;
  margin-bottom: 0.25rem;
  transition: all 0.3s ease;
  height: 3.8rem;
  cursor: pointer;
  position: relative;
  border-left: 0.25rem solid;
  flex-shrink: 0;
}

.alert-item.alert-danger {
  background: rgba(255, 77, 77, 0.15);
  border-color: #ff4d4d;
  border-left-color: #ff4d4d;
}

.alert-item.alert-warning {
  background: rgba(255, 204, 0, 0.15);
  border-color: #ffcc00;
  border-left-color: #ffcc00;
}

.alert-item.alert-info {
  background: rgba(79, 172, 254, 0.15);
  border-color: #4facfe;
  border-left-color: #4facfe;
}

.alert-item.alert-acknowledged {
  opacity: 0.6;
}

.alert-item.active {
  box-shadow: 0 0 0.6rem rgba(79, 172, 254, 0.3);
}

.alert-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.alert-time {
  color: #a0c8ff;
  font-size: 0.7rem;
}

.alert-level {
  font-size: 0.7rem;
  padding: 0.15rem 0.4rem;
  border-radius: 0.2rem;
  font-weight: bold;
}

.alert-level.danger {
  background: #ff4d4d;
  color: white;
}

.alert-level.warning {
  background: #ffcc00;
  color: #333;
}

.alert-level.info {
  background: #4facfe;
  color: white;
}

.alert-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 1;
}

.alert-device {
  font-weight: bold;
  font-size: 0.8rem;
  color: #fff;
}

.alert-message {
  flex: 1;
  font-size: 0.7rem;
  margin: 0 0.5rem;
  color: #fff;
}

.alert-temp {
  font-weight: bold;
  font-size: 0.8rem;
  width: 3rem;
  text-align: right;
}

.alert-acknowledged-badge {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  background: #00ff9d;
  color: #333;
  font-size: 0.6rem;
  padding: 0.1rem 0.3rem;
  border-radius: 0.2rem;
  font-weight: bold;
}

/* 调整告警容器高度 */
.alerts-container {
  height: 9.5rem;
  overflow-y: auto;
  position: relative;
  /* 隐藏滚动条 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

.alerts-container::-webkit-scrollbar {
  display: none; /* Chrome, Safari and Opera */
}

.alerts-scroll-wrapper {
transition: none;
}

/* 3D可视化样式 */
.factory-pipeline-3d {
  width: 100%;
  height: 100%;
  position: relative;
  background: radial-gradient(ellipse at center, #0a1a35 0%, #050d1a 100%);
  border-radius: 0.5rem;
  overflow: hidden;
}

.scene-container {
  width: 100%;
  height: 100%;
  cursor: pointer;
  position: relative;
}

.factory-map {
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
  opacity: 0.7;
}

.control-panel {
  position: absolute;
  top: 0.8rem;
  right: 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  z-index: 10;
}

.control-btn {
  background: rgba(16, 35, 70, 0.8);
  border: 0.06rem solid rgba(79, 172, 254, 0.5);
  color: #a0c8ff;
  padding: 0.3rem 0.6rem;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.3s ease;
}

.control-btn:hover {
  background: rgba(79, 172, 254, 0.3);
  border-color: #4facfe;
}

.device-count {
  background: rgba(16, 35, 70, 0.8);
  border: 0.06rem solid rgba(79, 172, 254, 0.5);
  color: #a0c8ff;
  padding: 0.3rem 0.6rem;
  border-radius: 0.25rem;
  font-size: 0.8rem;
  text-align: center;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: rgba(10, 26, 53, 0.8);
  z-index: 10;
}

.loading-spinner {
  width: 2.5rem;
  height: 2.5rem;
  border: 0.25rem solid rgba(79, 172, 254, 0.3);
  border-top: 0.25rem solid #4facfe;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.loading-text {
  color: #a0c8ff;
  font-size: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 原有样式保持不变 */
.device-detail-panel {
  min-height: 8rem;
  padding: 0.5rem;
}

.device-detail-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.detail-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.15rem 0;
  border-bottom: 0.06rem solid rgba(64, 128, 255, 0.2);
}

.info-label {
  color: #a0c8ff;
  font-size: 0.7rem;
  font-weight: bold;
}

.info-value {
  font-size: 0.7rem;
  color: #fff;
}

.status-overview-container {
  height: 10rem;
  overflow-y: auto; /* 允许垂直滚动 */
  position: relative;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

.status-overview-container::-webkit-scrollbar {
  display: none; /* Chrome, Safari and Opera */
}

.status-scroll-wrapper {
  /* 移除 transform 动画，让内容自然滚动 */
  transition: none;
}

.status-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem;
  border-radius: 0.4rem;
  background: rgba(16, 35, 70, 0.5);
  border: 0.06rem solid rgba(64, 128, 255, 0.2);
  margin-bottom: 0.25rem;
  transition: all 0.3s ease;
  height: 2.5rem;
  align-items: center;
}

.status-item.active {
  background: rgba(79, 172, 254, 0.2);
  border-color: #4facfe;
  box-shadow: 0 0 0.6rem rgba(79, 172, 254, 0.3);
}

.status-device {
  font-weight: bold;
  width: 4.5rem;
  font-size: 0.8rem;
}

.status-temp {
  font-weight: bold;
  width: 3rem;
  text-align: right;
  font-size: 0.8rem;
}

.status-location {
  flex: 1;
  text-align: right;
  font-size: 0.7rem;
  color: #a0c8ff;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: "Microsoft YaHei", sans-serif;
}

body {
  background-color: #0a1a35;
  color: #fff;
}

.dashboard {
  color: #ffffff !important;
  width: 100vw;
  height: 100vh;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  background: radial-gradient(ellipse at center, #0a1a35 0%, #050d1a 100%);
  position: relative;
  overflow: hidden;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  background: rgba(16, 35, 70, 0.7);
  border-radius: 0.5rem;
  margin-bottom: 0.8rem;
  box-shadow: 0 0 1rem rgba(0, 100, 255, 0.3);
  border: 0.06rem solid rgba(64, 128, 255, 0.2);
  z-index: 10;
  height: 3.2rem;
}

.header-left {
  flex: 1;
  display: flex;
  justify-content: flex-start;
}

.header-right {
  flex: 1;
  display: flex;
  justify-content: flex-end;
}

.title {
  font-size: 1.4rem;
  font-weight: bold;
  background: linear-gradient(90deg, #4facfe, #00f2fe);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 0.5rem rgba(0, 242, 254, 0.5);
  text-align: center;
  flex: 1;
}

.update-info {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.update-time, .device-count {
  color: #a0c8ff;
  font-size: 0.8rem;
  background: rgba(16, 35, 70, 0.5);
  padding: 0.2rem 0.5rem;
  border-radius: 0.2rem;
  border: 0.06rem solid rgba(64, 128, 255, 0.3);
}

.time {
  font-size: 0.9rem;
  color: #4facfe;
  background: rgba(16, 35, 70, 0.5);
  padding: 0.25rem 0.6rem;
  border-radius: 0.2rem;
  border: 0.06rem solid rgba(64, 128, 255, 0.3);
}

.main-content {
  display: flex;
  flex: 1.2;
  gap: 1rem;
  z-index: 5;
  min-height: 0;
}

.left-panel, .right-panel {
  flex: 0.8;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
}

.left-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.center-panel {
  flex: 2;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
}

.panel {
  background: rgba(16, 35, 70, 0.7);
  border-radius: 0.6rem;
  padding: 0.8rem;
  box-shadow: 0 0 1.3rem rgba(0, 100, 255, 0.2);
  border: 0.06rem solid rgba(64, 128, 255, 0.2);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 0.2rem;
  background: linear-gradient(90deg, #4facfe, #00f2fe);
}

.panel-title {
  font-size: 1rem;
  margin-bottom: 0.8rem;
  color: #4facfe;
  display: flex;
  align-items: center;
  justify-content: flex-start; /* 改为 flex-start */
  position: relative; /* 添加相对定位 */
  min-height: 1.5rem;
}

.panel-title i {
  margin-right: 0.4rem;
  font-size: 1.1rem;
}

.chart-container {
  flex: 1;
  min-height: 12.5rem;
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.prediction-chart {
  width: 100%;
  height: 100%;
  min-height: 12.5rem;
  flex: 1;
  min-height: 0;
  margin: 0 auto;
}

.surface-3d-chart {
  width: 100%;
  height: 100%;
  min-height: 12.5rem;
  flex: 1;
  min-height: 0;
  margin: 0 auto;
}

.device-map-container {
  flex: 1;
  position: relative;
  min-height: 0;
  width: 100%;
}

.stats-container {
  display: flex;
  justify-content: space-between;
  margin-top: 0.6rem;
}

.stat-item {
  text-align: center;
  flex: 1;
}

.stat-value {
  font-size: 1.3rem;
  font-weight: bold;
  margin: 0.3rem 0;
}

.stat-normal {
  color: #00ff9d;
}

.stat-warning {
  color: #ffcc00;
}

.stat-danger {
  color: #ff4d4d;
}

.stat-label {
  font-size: 0.8rem;
  color: #a0c8ff;
}

.system-status .status-item{
  display: flex;
  justify-content: space-between;
  padding: 0.15rem 0;
  height: 1.3rem;
  align-items: center;
}

.status-label {
  color: #a0c8ff;
  font-size: 0.8rem;
}

.status-value.normal {
  color: #00ff9d;
  font-size: 0.8rem;
}

.grid-line {
  position: absolute;
  background: rgba(64, 128, 255, 0.1);
}

.grid-line.horizontal {
  width: 100%;
  height: 0.06rem;
  left: 0;
}

.grid-line.vertical {
  width: 0.06rem;
  height: 100%;
  top: 0;
}

.data-stream {
  position: absolute;
  width: 0.13rem;
  height: 6.3rem;
  background: linear-gradient(to bottom, transparent, #4facfe, transparent);
  opacity: 0.5;
  animation: streamFlow 3s linear infinite;
}

@keyframes streamFlow {
  0% {
    transform: translateY(-6.3rem);
  }
  100% {
    transform: translateY(100vh);
  }
}

.overview-panel {
  margin-top: auto;
  height: 7.5rem;
}

.ring-chart-container {
  display: flex;
  flex-direction: column;
  height: 11.3rem;
}

.ring-chart {
  flex: 1;
  min-height: 0;
}

.ring-legend {
  display: flex;
  justify-content: space-around;
  margin-top: 0.6rem;
  padding-top: 0.6rem;
  border-top: 0.06rem solid rgba(64, 128, 255, 0.2);
}

.legend-item {
  display: flex;
  align-items: center;
  font-size: 0.8rem;
}

.legend-color {
  width: 0.8rem;
  height: 0.8rem;
  border-radius: 50%;
  margin-right: 0.3rem;
}

.legend-normal {
  background-color: #00ff9d;
}

.legend-warning {
  background-color: #ffcc00;
}

.legend-danger {
  background-color: #ff4d4d;
}

.ring-gauge-container {
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 100%;
  padding: 0.6rem 0;
}

.ring-gauge-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 30%;
}

.ring-gauge-chart {
  width: 5rem;
  height: 5rem;
}

.ring-gauge-label {
  margin-top: 0.6rem;
  font-size: 0.8rem;
  text-align: center;
}

.ring-gauge-title {
  font-size: 0.9rem;
  font-weight: bold;
  margin-bottom: 0.3rem;
  color: #4facfe;
}

.ring-gauge-value {
  font-size: 1rem;
  font-weight: bold;
  margin-top: 0.3rem;
}

.loading-indicator {
  margin-left: auto;
  display: flex;
  align-items: center;
}

.loading-text {
  color: #ffcc00;
  font-size: 0.8rem;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}

.no-data-prompt {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #a0c8ff;
}

.no-data-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.no-data-text {
  font-size: 0.9rem;
}

/* 新增设备提示框样式 */
.device-tooltip {
  position: absolute;
  background: rgba(16, 35, 70, 0.95);
  border: 1px solid rgba(64, 128, 255, 0.5);
  border-radius: 8px;
  padding: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
  z-index: 20;
  min-width: 150px;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s;
  backdrop-filter: blur(5px);
  max-width: 180px;
  word-wrap: break-word;
}

.device-tooltip.show {
  opacity: 1;
}

.tooltip-title {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 5px;
  color: #4facfe;
  border-bottom: 1px solid rgba(64, 128, 255, 0.3);
  padding-bottom: 4px;
}

.tooltip-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 3px;
  font-size: 12px;
  line-height: 1.3;
}

.tooltip-label {
  color: #a0c8ff;
  min-width: 40px;
}

.tooltip-value {
  color: #fff;
  text-align: right;
  flex: 1;
  margin-left: 10px;
}

/* 设备详情面板按钮 */
.detail-panel-btn {
  background: rgba(79, 172, 254, 0.3);
  border: 1px solid rgba(79, 172, 254, 0.5);
  color: #a0c8ff;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.7rem;
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.3s ease;
}

.detail-panel-btn:hover {
  background: rgba(79, 172, 254, 0.5);
  border-color: #4facfe;
}

/* 设备详情模态框样式 */
.device-detail-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1000;
}

.modal-overlay {
display: none;
}

.modal-content {
  position: absolute;
  width: 100vw;
  height: 100vh;
  background: rgba(10, 26, 53, 0.98);
  border-radius: 0; /* 移除圆角 */
  border: none; /* 移除边框 */
  box-shadow: none; /* 移除阴影 */
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 1001;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: rgba(16, 35, 70, 0.9);
  border-bottom: 1px solid rgba(64, 128, 255, 0.3);
  position: relative;
}

.modal-header h2 {
  color: #4facfe;
  font-size: 1.3rem;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: #a0c8ff;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.3s ease;
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
}

.close-btn:hover {
  background: rgba(255, 77, 77, 0.2);
  color: #ff4d4d;
}

.modal-body {
  flex: 1;
  padding: 1.5rem;
  overflow-y: hidden;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 1.5rem;
  height: 100%;
  overflow: hidden;
}

.detail-section {
  background: rgba(16, 35, 70, 0.7);
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid rgba(64, 128, 255, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.detail-section h3 {
  color: #4facfe;
  margin-bottom: 1rem;
  font-size: 1.1rem;
  border-bottom: 1px solid rgba(64, 128, 255, 0.3);
  padding-bottom: 0.5rem;
}

.detail-section.full-width {
  grid-column: 1 / -1;
}

.detail-info-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.8rem;
  overflow: hidden;
}

.detail-info-item {
  display: flex;
  justify-content: space-between;
  padding: 0.2rem 0;
  border-bottom: 1px solid rgba(64, 128, 255, 0.1);
}

.detail-label {
  color: #a0c8ff;
  font-weight: bold;
  font-size: 0.8rem;
}

.detail-value {
  color: #fff;
  font-size: 0.8rem;
}

.status-normal {
  color: #00ff9d;
}

.status-danger {
  color: #ff4d4d;
}

.temperature-trend-chart,
.alert-history-chart {
  width: 100%;
  height: 100%;
  min-height: auto;
}

.time-range-selector {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.time-range-selector button {
  background: rgba(16, 35, 70, 0.8);
  border: 1px solid rgba(79, 172, 254, 0.5);
  color: #a0c8ff;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.3s ease;
}

.time-range-selector button.active {
  background: rgba(79, 172, 254, 0.3);
  border-color: #4facfe;
  color: #fff;
}

.time-range-selector button:hover {
  background: rgba(79, 172, 254, 0.5);
  border-color: #4facfe;
}

/* 新增：工厂选择器样式 - 中间位置 */
.factory-selector-center {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(16, 35, 70, 0.8);
  border: 1px solid rgba(79, 172, 254, 0.5);
  border-radius: 4px;
  padding: 0.2rem 0.5rem;
}

.factory-nav-btn {
  background: transparent;
  border: none;
  color: #a0c8ff;
  cursor: pointer;
  font-size: 0.9rem;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  transition: all 0.3s ease;
}

.factory-nav-btn:hover {
  background: rgba(79, 172, 254, 0.3);
  color: #fff;
}

.factory-name {
  font-size: 0.8rem;
  color: #fff;
  min-width: 4rem;
  text-align: center;
}

/* 新增：右侧控制按钮样式 */
.factory-controls-right {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.save-positions-btn {
  background: rgba(79, 172, 254, 0.3);
  border: 1px solid rgba(79, 172, 254, 0.5);
  color: #a0c8ff;
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.7rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.save-positions-btn:hover:not(:disabled) {
  background: rgba(79, 172, 254, 0.5);
  border-color: #4facfe;
  color: #fff;
}

.save-positions-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.factory-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
  opacity: 0.7;
}
.prediction-controls {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.interval-select {
  background: rgba(16, 35, 70, 0.8);
  border: 1px solid rgba(79, 172, 254, 0.5);
  color: #a0c8ff;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-size: 0.7rem;
  cursor: pointer;
}

.interval-select:focus {
  outline: none;
  border-color: #4facfe;
}
</style>