// src/main.ts —— 唯一 JS 入口：挂载 App 并引入主样式（D01 §1）
import { createApp } from 'vue'
import App from './App.vue'
import './assets/main.css'

createApp(App).mount('#app')
