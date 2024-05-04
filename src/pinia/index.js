export { createPinia } from './createPinia'
export { defineStore } from './store'
import { toRaw, isRef, isReactive, toRef } from 'vue'

export function storeToRefs(store) {
  // store 转为普通对象
  store = toRaw(store)

  const result = {}

  for (let key in store) {
    let value = store[key]
    // 剔除掉方法，只保留响应式属性
    if (isRef(value) || isReactive(value)) {
      result[key] = toRef(store, key)
    }
  }

  return result
}
