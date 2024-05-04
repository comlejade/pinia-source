import { PiniaSymbol } from './rootStore'
import { ref } from 'vue'

export function createPinia() {
  // pinia 管理多个store （管理store的状态）
  // ref可以传基本类型，也可以传入引用类型
  // 映射状态
  const state = ref({})

  const pinia = {
    install(app) {
      app.config.globalProperties.$pinia = pinia

      //   vue3 通过provide inject 注入
      app.provide(PiniaSymbol, pinia)
    },
    state,
    _s: new Map() // id -> store
  }

  return pinia
}
