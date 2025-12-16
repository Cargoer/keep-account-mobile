<!-- views/HomePage.vue -->
<template>
  <div class="home-container">
    <!-- 日历视图 -->
    <div class="calendar-container">
      <div class="calendar-header">
        <h2 class="current-date">{{ displayDate }}</h2>
        <button class="expand-btn" @click="toggleExpand">
          {{ isExpanded ? '收起' : '展开' }}
        </button>
      </div>
      
      <!-- 星期标题 -->
      <div class="weekdays">
        <div class="weekday">日</div>
        <div class="weekday">一</div>
        <div class="weekday">二</div>
        <div class="weekday">三</div>
        <div class="weekday">四</div>
        <div class="weekday">五</div>
        <div class="weekday">六</div>
      </div>
      
      <!-- 日历网格 - 使用触摸滑动 -->
      <div 
        class="calendar-grid"
        :class="{ expanded: isExpanded }"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
      >
        <div class="calendar-days">
          <!-- 日期单元格 -->
          <div 
            v-for="(day, index) in calendarDays" 
            :key="index"
            class="day-cell"
            :class="{
              'current-month': day.isCurrentMonth,
              'selected': day.date === selectedDate,
              'other-month': !day.isCurrentMonth
            }"
            :style="{ backgroundColor: getDayColor(remainOfTheDay(day.day, day.isCurrentMonth)) }"
            @click="selectDate(day.date)"
          >
            <div class="day-number">{{ day.day }}</div>
            <div class="day-balance">{{ remainOfTheDay(day.day, day.isCurrentMonth) }}</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 记账列表 -->
    <div class="records-container">
      <div class="records-header">
        <h3 class="records-date">{{ formatSelectedDate() }}</h3>
        <!-- 添加按钮 -->
        <button class="add-btn" @click="$router.push({ name: 'add', query: { date: selectedDate } })">
          <span class="plus">添加</span>
        </button>
      </div>
      
      <div class="records-list" v-if="selectedDateRecords.length > 0">
        <div class="record-item" v-for="(record, index) in selectedDateRecords" :key="index">
          <div class="record-content">
            <div class="record-type">{{ record.payWay }} {{ record.category }}</div>
            <div class="record-desc">{{ record.content }}</div>
          </div>
          <div class="record-amount" :class="{ income: record.isIncome }">
            {{ record.isIncome ? '+' : '-' }}{{ record.amount.toFixed(2) }}
          </div>
        </div>
      </div>
      
      <div class="empty-state" v-else>
        今天还没有记账记录
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, onBeforeRouteUpdate } from 'vue-router'
import moment from 'moment'
import { useDataStore } from '@/stores/data'
const dataStore = useDataStore()

import { queryMonthlyRecords, getDailyStatisticsOfMonth, getFinanceStats, queryDailyRecords } from '@/request/supabase.js'

// 状态管理
const selectedDate = ref('')
const yearAndMonth = ref(moment().format('YYYY-MM'))
const isExpanded = ref(false)
const calendarDays = ref([])
const selectedDateRecords = ref([])

const dailyStatistics = ref([])
const remainOfTheDay = computed(() => {
  return (day, isCurrentMonth) => {
    if (!isCurrentMonth) {
      return ''
    }
    const stats = dailyStatistics.value.find(item => item.date === `${yearAndMonth.value}-${day.toString().padStart(2, '0')}`)
    return typeof stats?.dailyremain === 'number' ? stats?.dailyremain : '/'
  }
})
watch(yearAndMonth, async (newYearAndMonth) => {
  dailyStatistics.value = await getDailyStatisticsOfMonth(newYearAndMonth)
})

// 触摸滑动相关
const touchStartX = ref(null)
const touchEndX = ref(null)


async function refreshPage () {
  dailyStatistics.value = await getDailyStatisticsOfMonth(yearAndMonth.value)
  selectedDateRecords.value = await queryDailyRecords(selectedDate.value)
}

// 初始化
onMounted(async () => {
  const today = new Date()
  selectedDate.value = moment().format('YYYY-MM-DD')
  // currentMonth.value = moment().month() + 1
  // currentYear.value = moment().year()
  yearAndMonth.value = moment().format('YYYY-MM')

  // dailyStatistics.value = await getDailyStatisticsOfMonth(yearAndMonth.value)
  
  generateCalendarDays()
  // generateMockRecords()
  await refreshPage()
  await dataStore.initEnums()
})

// 生成日历日期
function generateCalendarDays() {
  if (isExpanded.value) {
    generateMonthView()
  } else {
    generateWeekView()
  }
}

// 生成月视图
function generateMonthView() {
  const days = []
  const firstDay = moment(yearAndMonth.value).startOf('month').toDate()
  const lastDay = moment(yearAndMonth.value).endOf('month').toDate()
  
  // 上个月的最后几天
  const prevMonthLastDay = moment(yearAndMonth.value).startOf('month').subtract(1, 'day').date()
  const firstDayOfWeek = firstDay.getDay()
  
  for (let i = 0; i < firstDayOfWeek; i++) {
    const day = prevMonthLastDay - firstDayOfWeek + i + 1
    const date = moment(yearAndMonth.value).subtract(1, 'month').date(day).toDate()
    days.push({
      day,
      date: formatDate(date),
      balance: generateMockBalance(),
      isCurrentMonth: false
    })
  }
  
  // 当月的天数
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const date = moment(yearAndMonth.value).date(i).toDate()
    days.push({
      day: i,
      date: formatDate(date),
      balance: generateMockBalance(),
      isCurrentMonth: true
    })
  }
  
  // 下个月的前几天
  const remainingDays = 42 - days.length // 6周 * 7天 = 42
  for (let i = 1; i <= remainingDays; i++) {
    const date = moment(yearAndMonth.value).add(1, 'month').date(i).toDate()
    days.push({
      day: i,
      date: formatDate(date),
      balance: generateMockBalance(),
      isCurrentMonth: false
    })
  }
  
  calendarDays.value = days
}

// 生成周视图
function generateWeekView() {
  const days = []
  const selected = new Date(selectedDate.value)
  const dayOfWeek = selected.getDay()
  const startOfWeek = new Date(selected)
  startOfWeek.setDate(selected.getDate() - dayOfWeek)
  
  for (let i = 0; i < 7; i++) {
    const current = new Date(startOfWeek)
    current.setDate(startOfWeek.getDate() + i)
    
    days.push({
      day: current.getDate(),
      date: formatDate(current),
      balance: generateMockBalance(),
      isCurrentMonth: current.getMonth() === moment(yearAndMonth.value).month()
    })
  }
  
  calendarDays.value = days
}

// 切换展开/收起状态
function toggleExpand() {
  isExpanded.value = !isExpanded.value
  generateCalendarDays()
}

// 选择日期
function selectDate(date) {
  selectedDate.value = date
  const newDate = new Date(date)
  currentMonth.value = newDate.getMonth()
  currentYear.value = newDate.getFullYear()
  
  // 如果是收起状态，刷新周视图
  if (!isExpanded.value) {
    generateWeekView()
  }
  
  // 这里应该请求该日期的记录，这里用mock数据
  generateMockRecords()
}

// 处理滑动开始
function handleTouchStart(e) {
  touchStartX.value = e.touches[0].clientX
}

// 处理滑动中
function handleTouchMove(e) {
  touchEndX.value = e.touches[0].clientX
}

// 处理滑动结束
function handleTouchEnd() {
  if (!touchStartX.value || !touchEndX.value) {
    return
  }

  const diffX = touchEndX.value - touchStartX.value
  touchStartX.value = null
  touchEndX.value = null
  
  // 左滑 - 下一个周期
  if (diffX < -100) {
    if (isExpanded.value) {
      // 月份视图 - 下一个月
      yearAndMonth.value = moment(yearAndMonth.value).add(1, 'month').format('YYYY-MM')
    } else {
      // 周视图 - 下一周
      const current = new Date(selectedDate.value)
      current.setDate(current.getDate() + 7)
      selectedDate.value = formatDate(current)
      yearAndMonth.value = moment(selectedDate.value).format('YYYY-MM')
    }
    generateCalendarDays()
  }
  
  // 右滑 - 上一个周期
  if (diffX > 100) {
    if (isExpanded.value) {
      // 月份视图 - 上一个月
      yearAndMonth.value = moment(yearAndMonth.value).subtract(1, 'month').format('YYYY-MM')
    } else {
      // 周视图 - 上一周
      const current = new Date(selectedDate.value)
      current.setDate(current.getDate() - 7)
      selectedDate.value = formatDate(current)
      yearAndMonth.value = moment(selectedDate.value).format('YYYY-MM')
    }
    generateCalendarDays()
  }
}

// 格式化日期为 yyyy-mm-dd
function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 获取日期显示文本
const displayDate = computed(() => {
  const [year, month] = yearAndMonth.value.split('-')
  return `${year}年${month}月`
})

// 格式化选中的日期显示
function formatSelectedDate() {
  const date = new Date(selectedDate.value)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekday = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()]
  return `${year}年${month}月${day}日 星期${weekday}`
}

// 生成模拟余额
function generateMockBalance() {
  // 生成-300到300之间的随机数
  return Math.floor(Math.random() * 601) - 300
}

// 生成模拟记录
async function getRecords() {
  selectedDateRecords.value = await queryDailyRecords(selectedDate.value)
}
watch(selectedDate, async (newSelectedDate) => {
  await getRecords()
})

// 格式化余额显示
function formatBalance(balance) {
  if (balance === 0) return '0'
  return balance > 0 ? `+${balance}` : balance.toString()
}

// 获取日期单元格背景颜色
function getDayColor(balance) {
  if (typeof balance !== 'number') {
    return 'transparent' // 非数字时透明
  }

  if (balance > 200) {
    return 'rgba(128, 0, 128, 0.2)' // 紫色
  } else if (balance > 0) {
    return 'rgba(0, 0, 255, 0.2)' // 蓝色
  } else if (balance <= 0) {
    // 从-200到0的绿色到红色过渡
    const ratio = Math.min(Math.abs(balance) / 200, 1)
    const green = Math.floor(255 * (1 - ratio))
    const red = Math.floor(255 * ratio)
    return `rgba(${red}, ${green}, 0, 0.2)`
  }
  return 'transparent' // 零的时候透明
}

// 观察路由，从添加页面返回后刷新页面数据
onBeforeRouteUpdate(async (to, from) => {
  if (from.name === 'AddRecordPage') {
    await refreshPage()
  }
})
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  padding-bottom: 70px;
}

/* 日历样式 */
.calendar-container {
  background-color: white;
  padding: 15px;
  margin-bottom: 10px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.records-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  /* margin-bottom: 15px; */
}

.current-date {
  font-size: 18px;
  font-weight: 600;
}

.expand-btn {
  color: #4285f4;
  font-size: 14px;
}

.weekdays {
  display: flex;
  margin-bottom: 10px;
}

.weekday {
  flex: 1;
  text-align: center;
  font-size: 12px;
  color: #666;
  padding: 5px 0;
}

.calendar-grid {
  overflow: hidden;
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 5px;
  transition: transform 0.3s ease;
}

.day-cell {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  padding: 3px;
  cursor: pointer;
  position: relative;
}

.day-number {
  font-size: 14px;
  font-weight: 500;
}

.day-balance {
  font-size: 10px;
  margin-top: 2px;
}

.other-month {
  opacity: 0.5;
}

.selected {
  border: 2px solid #4285f4;
}

.expanded .calendar-days {
  grid-template-rows: repeat(6, 1fr);
}

/* 记账列表样式 */
.records-container {
  padding: 0 15px;
}

.records-date {
  font-size: 16px;
  margin: 15px 0;
  color: #666;
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.record-item {
  background-color: white;
  padding: 12px 15px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.record-content {
  display: flex;
  flex-direction: column;
}

.record-type {
  font-size: 12px;
  color: #666;
  margin-bottom: 3px;
}

.record-desc {
  font-size: 16px;
  font-weight: 500;
}

.record-amount {
  font-size: 16px;
  font-weight: 600;
  color: #ff4d4f; /* 支出红色 */
}

.record-amount.income {
  color: #52c41a; /* 收入绿色 */
}

.add-btn {
  color: #4285f4;
  font-size: 14px;
}

/* .empty-state {
  text */
</style>