import { getCurrentInstance, inject, reactive, computed, toRefs } from 'vue'
import { PiniaSymbol } from './rootStore'

export function defineStore(idOrOptions, setup) {
  let id
  let options

  const isSetupStore = typeof setup === 'function' // 区分

  // 对用户的两种写法做一个处理
  if (typeof idOrOptions === 'string') {
    id = idOrOptions
    options = setup
  } else {
    options = idOrOptions
    id = idOrOptions.id
  }

  function useStore() {
    // 这个 useStore 只能在组件中使用
    const currentInstance = getCurrentInstance()
    // 只有在组件实例中在才能使用 inject 注入 pinia
    const pinia = currentInstance && inject(PiniaSymbol)

    // 检查pinia中有没有这个store，没有就创建一个
    if (!pinia._s.has(id)) {
      if (isSetupStore) {
        createSetupStore(id, setup, pinia)
      } else {
        // 创建后的store只需要存到_s中即可
        createOptionStore(id, options, pinia)
      }
    }

    const store = pinia._s.get(id)

    return store
  }

  return useStore
}

// setupStore 用户已经提供了完整的setup方法，只需执行setup即可
// 通过这个返回值放到store上
function createSetupStore(id, setup, pinia) {
  const store = reactive({}) // pinia就是创建了一个响应式对象

  function wrapAction(action) {
    return function () {
      // 将 action 中的this指向store
      action.call(store, ...arguments)
    }
  }

  const setupStore = setup() // this 指向需要处理

  for (let prop in setupStore) {
    let value = setupStore[prop]
    if (typeof value === 'function') {
      // 将函数的this指向store
      setupStore[prop] = wrapAction(value)
    }
  }

  Object.assign(store, setupStore)
  pinia._s.set(id, store)

  return store
}

// options Api 需要将这个api转化成setup方法
function createOptionStore(id, options, pinia) {
  const { state, actions, getters } = options

  // 格式化store
  function setup() {
    // 用户提供的状态
    pinia.state.value[id] = state ? state() : {}
    // 解构 store，并保持每个属性的响应性
    const localState = toRefs(pinia.state.value[id])
    // actions 是用户提供的动作
    return Object.assign(
      localState,
      actions,
      Object.keys(getters).reduce((computeds, gettersKey) => {
        computeds[gettersKey] = computed(() => {
          const store = pinia._s.get(id)
          return getters[gettersKey].call(store)
        })
        return computeds
      }, {})
    )
  }

  createSetupStore(id, setup, pinia)
}
