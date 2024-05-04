import { createApp } from 'vue'
import { createPinia } from './pinia'

import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()

function persitsPlugin() {
  // 所有的store都会执行此方法
  return ({ store, id }) => {
    let oldState = JSON.parse(localStorage.getItem(id) || '{}')
    // store.$patch(oldState)
    store.$state = oldState

    store.$subscribe((mutation, state) => {
      localStorage.setItem(id, JSON.stringify(state))
    })
  }
}

// pinia 插件用法
pinia.use(persitsPlugin())

app.use(pinia)

app.mount('#app')
