import { getCurrentInstance, inject, reactive, computed, toRefs, isRef, watch } from 'vue'
import { PiniaSymbol } from './rootStore'
import { addSubscription, triggerSubscription } from './sub'

function isObject(value) {
  return typeof value === 'object' && value !== null
}

function isComputed(value) {
  return isRef(value) && value.effect
}

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
        createSetupStore(id, setup, pinia, isSetupStore)
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
function createSetupStore(id, setup, pinia, isSetupStore) {
  function merge(target, partialState) {
    for (const key in partialState) {
      if (Object.prototype.hasOwnProperty.call(partialState, key)) {
        const targetValue = target[key]
        const subPatch = partialState[key]

        if (isObject(targetValue) && isObject(subPatch) && !isRef(subPatch)) {
          // 如果是ref就不递归了
          target[key] = merge(targetValue, subPatch)
        } else {
          target[key] = subPatch // 如果不需要合并，直接用新的覆盖老的
        }
      }
    }

    return target
  }

  // 需要获取到原来的所有状态
  function $patch(partialStoreMutator) {
    // partialStateOrMutator 部分状态
    // 当前 store 中的全部状态

    if (typeof partialStoreMutator !== 'function') {
      // 如果 partialStoreMutator 是对象
      merge(pinia.state.value[id], partialStoreMutator)
    } else {
      // 将当前store的状态传进去
      partialStoreMutator(pinia.state.value[id])
    }

    // console.log(pinia.state.value[id])
  }

  const actionSubscriptions = [] // 所有的订阅事件

  const partialStore = {
    $patch,
    $subscribe(callback) {
      watch(pinia.state.value[id], (state) => {
        callback(id, state)
      })
    },
    $onAction: addSubscription.bind(null, actionSubscriptions) // 订阅
  }

  const store = reactive(partialStore) // pinia就是创建了一个响应式对象

  function wrapAction(action) {
    return function () {
      // 将 action 中的this指向store

      const afterCallbacks = []

      const onErrorCallbacks = []

      const after = (callback) => {
        afterCallbacks.push(callback)
      }

      const onError = (callback) => {
        onErrorCallbacks.push(callback)
      }

      // 让用户传递 after 和 error
      triggerSubscription(actionSubscriptions, { after, onError })

      let ret

      // 回调
      try {
        // 正常action是一个回调，我们可以直接拿到返回值触发 after 回调
        ret = action.call(store, ...arguments)
        triggerSubscription(afterCallbacks, ret)
      } catch (error) {
        triggerSubscription(onErrorCallbacks, error)
      }

      // 返回值是promise
      if (ret instanceof Promise) {
        return ret
          .then((value) => {
            triggerSubscription(afterCallbacks, value)
          })
          .catch((error) => {
            triggerSubscription(onErrorCallbacks, error)
          })
      }

      return ret
    }
  }

  if (isSetupStore) {
    // 用于存放setupStore的id 对应的store
    pinia.state.value[id] = {}
  }

  const setupStore = setup() // this 指向需要处理

  for (let prop in setupStore) {
    let value = setupStore[prop]
    if (typeof value === 'function') {
      // 将函数的this指向store
      setupStore[prop] = wrapAction(value)
    } else if (isSetupStore) {
      // 对 setupStore 做一些处理
      // 是用户写的compositionApi
      //将用户返回的对象里面的所有属性，都存到state属性中
      if (!isComputed(value)) {
        pinia.state.value[id][prop] = value
      }
    }
  }

  Object.assign(store, setupStore)

  Object.defineProperty(store, '$state', {
    get() {
      return pinia.state.value[id]
    },
    set(newState) {
      store.$patch(newState)
    }
  })

  pinia._p.forEach((plugin) => {
    !!plugin && plugin({ store, id })
  })

  // 在放入之前先执行插件
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

  const store = createSetupStore(id, setup, pinia)
  // 只支持optionsApi
  store.$reset = function () {
    const newState = state ? state() : {}
    this.$patch(newState)
  }

  return store
}
