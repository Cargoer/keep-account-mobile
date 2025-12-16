import { createApp } from 'vue'
import App from './App.vue'
import { createRouter, createWebHistory } from 'vue-router'
import HomePage from './views/HomePage.vue'
import AddRecordPage from './views/AddRecordPage.vue'

import './style.css'

// 引入element-plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomePage },
    { path: '/add', name: 'add', component: AddRecordPage }
  ]
})

// 使用pinia状态管理
import { createPinia } from 'pinia'
const pinia = createPinia()

createApp(App)
  .use(router)
  .use(ElementPlus)
  .use(pinia)
  .mount('#app')