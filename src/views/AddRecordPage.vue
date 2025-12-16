<!-- views/AddRecordPage.vue -->
<template>
  <div class="add-record-page">
    <!-- 顶部导航栏 -->
    <div class="nav-bar">
      <button class="back-btn" @click="$router.go(-1)">
        <svg class="back-icon" viewBox="0 0 24 24" width="24" height="24">
          <path fill="currentColor" d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
        </svg>
      </button>
      <h1 class="page-title">添加记账</h1>
      <div class="nav-spacer"></div>
    </div>

    <form class="record-form" @submit.prevent="handleSubmit">
      <!-- 金额（优化后） -->
      <div class="form-group amount-group">
        <div class="amount-input-wrapper">
          <span class="currency-symbol">¥</span>
          <input 
            type="number" 
            v-model="formData.amount" 
            class="form-input amount-input" 
            placeholder="输入金额"
            step="0.01"
            min="0"
            @input="handleAmountInput"
          >
        </div>
      </div>

      <!-- 记账内容（优化后） -->
      <div class="form-group notes-group">
        <div class="notes-bar">
          <span class="today-tag">{{ selectedDate }}</span>
          <input 
            type="text" 
            v-model="formData.content" 
            class="notes-input" 
            placeholder="请输入记账内容"
          >
        </div>
      </div>

      <!-- 分类 -->
      <div class="form-group">
        <!-- <label class="form-label">分类 <span class="required">*</span></label> -->
        <div>
          <el-radio-group v-model="formData.recordType" size="medium" fill="#4285f4">
            <el-radio-button v-for="type in recordTypes" :key="type.value" :label="type.value" :value="type.value" />
          </el-radio-group>
        </div>
        <div class="category-grid">
          <button 
            type="button"
            class="category-item"
            v-for="category in categories" 
            :key="category.value"
            :class="{ selected: formData.category === category.value }"
            @click="formData.category = category.value"
          >
            {{ category.value }}
          </button>
        </div>
      </div>

      <!-- 支付渠道 -->
      <div class="form-group">
        <label class="form-label">支付渠道 <span class="required">*</span></label>
        <div class="payment-grid">
          <button 
            type="button"
            class="payment-item"
            v-for="payment in paymentMethods" 
            :key="payment.value"
            :class="{ selected: formData.payWay === payment.value }"
            @click="formData.payWay = payment.value"
          >
            {{ payment.value }}
          </button>
        </div>
      </div>

      <!-- 备注 -->
      <div class="form-group">
        <label class="form-label">备注</label>
        <textarea 
          v-model="formData.note" 
          class="form-textarea" 
          placeholder="请输入备注"
          rows="3"
        ></textarea>
      </div>

      <!-- 提交按钮 -->
      <div class="form-actions">
        <el-button type="button" class="cancel-btn" @click="$router.go(-1)">取消</el-button>
        <el-button type="submit" class="submit-btn" :loading="submitLoading" @click="handleSubmit">提交</el-button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getEnumValues, insertRecord } from '@/request/supabase.js'
import { ElMessage } from 'element-plus'
import { useDataStore } from '@/stores/data'
import { storeToRefs } from 'pinia'
const dataStore = useDataStore()
const { recordTypes, categories, paymentMethods } = storeToRefs(dataStore)

// 路由相关
const route = useRoute()
const router = useRouter()

// 选中的日期（从上一页传递过来）
const selectedDate = ref('')

// 表单数据
const formData = ref({
  content: '',
  amount: '',
  recordType: '支出',
  category: '餐饮', 
  payWay: '微信',
  note: '',
})


// 初始化
onMounted(async () => {
  // 获取从上一页传递的日期参数
  if (route.query.date) {
    selectedDate.value = formatDate(route.query.date)
  } else {
    // 默认使用今天的日期
    selectedDate.value = formatDate(new Date())
  }
})

// 格式化日期显示
function formatDate(dateStr) {
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekday = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()]
  return `${year}-${month}-${day} ${weekday}`
}

// 处理金额输入
function handleAmountInput(e) {
  // 确保金额最多两位小数
  const value = e.target.value
  if (value) {
    const parts = value.split('.')
    if (parts.length > 1 && parts[1].length > 2) {
      formData.value.amount = parseFloat(value).toFixed(2)
    }
  }
}

// 验证表单
function validateForm() {
  // 验证金额
  if (!formData.value.amount || isNaN(formData.value.amount) || parseFloat(formData.value.amount) < 0) {
    ElMessage.error('请输入有效的金额')
    return false
  }

  // 验证记账内容
  if (!formData.value.content.trim()) {
    ElMessage.error('请输入记账内容')
    return false
  }
  
  // 验证分类
  if (!formData.value.category) {
    ElMessage.error('请选择分类')
    return false
  }
  
  // 验证支付渠道
  if (!formData.value.payWay) {
    ElMessage.error('请选择支付渠道')
    return false
  }
  
  return true
}

// 处理表单提交
import { v4 as uuidv4 } from 'uuid'
const submitLoading = ref(false)
function handleSubmit() {
  if (validateForm()) {
    submitLoading.value = true
    insertRecord({
      id: uuidv4(), // 生成唯一ID
      createDate: route.query.date,
      ...formData.value,
    }).then(() => {
      formData.value.content = ''
      formData.value.amount = ''
      formData.value.recordType = '支出'
      formData.value.category = '餐饮' 
      formData.value.payWay = '微信'
      formData.value.note = ''
      // ElMessage.success('提交记账成功')
      router.go(-1)
    }).catch((error) => {
      ElMessage.error('提交记账失败：' + error.message)
      console.error('提交记账失败：', error)
    }).finally(async () => {
      submitLoading.value = false
    })
  }
}
</script>

<style scoped>
.add-record-page {
  min-height: 100vh;
  background-color: #f5f5f7;
  padding-top: 50px;
}

/* 导航栏样式 */
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 50px;
  background-color: white;
  padding: 0 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.back-btn {
  color: #333;
  padding: 5px;
}

.back-icon {
  vertical-align: middle;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.nav-spacer {
  width: 24px;
}

/* 表单样式 */
.record-form {
  padding: 16px;
}

.form-group {
  margin-bottom: 10px;
  background-color: white;
  border-radius: 12px;
  padding: 14px 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.fr {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.form-label {
  display: block;
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
  font-weight: 500;
}

.required {
  color: #ff4d4f;
}

.form-input {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  color: #333;
  background-color: #f9f9f9;
  transition: all 0.2s ease;
}

.form-input:focus {
  border-color: #4285f4;
  background-color: white;
  box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.2);
}

.form-input.error {
  border-color: #ff4d4f;
}

/* 日期样式 */
.date-group {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.date-value {
  font-size: 16px;
  color: #333;
  font-weight: 500;
}

/* 金额输入样式 */
.amount-input-wrapper {
  position: relative;
}

.currency-symbol {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
  font-size: 16px;
}

.amount-input {
  padding-left: 30px !important;
}

/* 单选按钮样式 */
.radio-group {
  display: flex;
  gap: 12px;
}

.radio-option {
  display: flex;
  align-items: center;
  cursor: pointer;
  position: relative;
  padding-left: 28px;
  font-size: 16px;
  color: #333;
}

.radio-option input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
}

.radio-option .radio-text {
  position: relative;
  padding: 8px 16px;
  border-radius: 20px;
  border: 1px solid #ddd;
  transition: all 0.2s ease;
}

.radio-option input:checked + .radio-text {
  background-color: #4285f4;
  color: white;
  border-color: #4285f4;
}

/* 分类和支付渠道网格 */
.category-grid, .payment-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-top: 16px;
}

.category-item, .payment-item {
  padding: 8px 0;
  border-radius: 8px;
  border: 1px solid #ddd;
  background-color: white;
  font-size: 14px;
  color: #333;
  text-align: center;
  transition: all 0.2s ease;
}

.category-item.selected, .payment-item.selected {
  background-color: #4285f4;
  color: white;
  border-color: #4285f4;
}

/* 备注输入框 */
.form-textarea {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  color: #333;
  background-color: #f9f9f9;
  resize: none;
  transition: all 0.2s ease;
}

.form-textarea:focus {
  outline: none;
  border-color: #4285f4;
  background-color: white;
  box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.2);
}

/* 错误信息 */
.error-message {
  margin-top: 6px;
  font-size: 12px;
  color: #ff4d4f;
  line-height: 1.4;
}

/* 按钮区域 */
.form-actions {
  display: flex;
  gap: 16px;
  margin-top: 30px;
  padding: 0 16px;
}

.cancel-btn, .submit-btn {
  flex: 1;
  padding: 14px 0;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.cancel-btn {
  color: #333;
  border: 1px solid #ddd;
  background-color: white;
}

.cancel-btn:hover {
  background-color: #f5f5f7;
}

.submit-btn {
  color: white;
  border: none;
  background-color: #4285f4;
}

.submit-btn:hover {
  background-color: #3367d6;
}

/* // 金额输入区域优化 */
.amount-group {
  background: #fff;
  border-radius: 12px 12px 0 0;
  padding: 0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}
.amount-input-wrapper {
  position: relative;
  height: 56px; /* 固定高度匹配参考图 */
  display: flex;
  align-items: center;
  padding: 0 16px;
  border-bottom: 1px solid #f0f0f0;
}
.currency-symbol {
  position: static;
  transform: none;
  font-size: 18px;
  color: #333;
  margin-right: 4px;
}
.amount-input {
  padding: 0 !important;
  border: none;
  background: transparent;
  font-size: 18px;
  height: 100%;
  flex: 1;
}
.amount-input:focus {
  box-shadow: none;
  background: transparent;
}

/* 备注区域优化 */
.notes-group {
  background: #fff;
  border-radius: 0 0 12px 12px;
  padding: 0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  margin-top: -10px; /* 与金额区域衔接 */
}
.notes-bar {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  gap: 12px;
}
.today-tag, .time-tag {
  padding: 4px 8px;
  background: #f5f5f5;
  border-radius: 12px;
  font-size: 12px;
  color: #666;
}
.notes-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 14px;
  color: #999;
  padding: 4px 0;
}
.notes-input:focus {
  outline: none;
  color: #333;
}

/* 多选项开关式单选样式 */
.radio-group-container {
  background-color: white;
  border-radius: 12px;
  padding: 14px 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
}

.multi-switch {
  display: flex;
  flex-wrap: wrap; /* 自动换行 */
  gap: 10px; /* 选项间距 */
  margin-top: 8px;
}

.multi-option {
  padding: 8px 16px;
  border-radius: 20px; /* 圆角 */
  border: 1px solid #e5e5e5;
  font-size: 15px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap; /* 防止文字换行 */
}

/* 选中状态 */
.multi-option.active {
  background-color: #4285f4;
  color: white;
  border-color: #4285f4;
  box-shadow: 0 2px 5px rgba(66, 133, 244, 0.2);
}

/* 悬停效果（非选中状态） */
.multi-option:not(.active):hover {
  border-color: #ccc;
  background-color: #f9f9f9;
}

/* 记账类型开关样式 */
.type-group {
  background: #fff;
  border-radius: 12px;
  padding: 14px 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
}
.type-switch {
  display: flex;
  align-items: center;
  width: 140px;
  height: 38px;
  border: 1px solid #e5e5e5;
  border-radius: 14px;
  overflow: hidden;
}
.type-option {
  flex: 1;
  text-align: center;
  padding: 10px 0;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  /* flex-shrink: 0; */
  transition: all 0.2s ease;
}
.type-option.active {
  background-color: #4285f4;
  color: #fff;
}

/** 更改element的元素样式 */
::v-deep .el-radio-group {
  border-radius: 20px;
}

::v-deep .el-radio-button__inner {
  padding: 10px 12px;
  /* border-radius: 20px; */
}
</style>