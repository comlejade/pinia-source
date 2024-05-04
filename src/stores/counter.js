import { defineStore } from '../pinia'
import { ref, computed } from 'vue'

// export const useCounterStore = defineStore('counter', {
//   state: () => {
//     return { count: 0 }
//   },
//   getters: {
//     double() {
//       return this.count * 2
//     }
//   },
//   actions: {
//     increment(payload) {
//       console.log('this', this)
//       this.count += payload
//     }
//   }
// })

export const useCounterStore = defineStore('counter', () => {
  // setup 同组件的setup，可以直接将组件中的setup直接拿过来用
  const count = ref(0)

  const double = computed(() => {
    return count.value * 2
  })

  const increment = (payload) => {
    count.value += payload
  }

  return {
    count,
    double,
    increment
  }
})
