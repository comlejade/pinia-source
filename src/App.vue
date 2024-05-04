<script setup>
import { useCounterStore } from './stores/counter'

const store = useCounterStore()

console.log(store)

const { increment } = store

const patch = () => {
  // store.$patch({ count: 2 })
  store.$patch((state) => {
    state.count++
    state.count++
  })
}

const reset = () => {
  store.$reset()
}

store.$subscribe((mutation, state) => {
  // 只要状态变化，我们可以监控到发生的动作和最新的状态是什么
  console.log(mutation, state)
})

store.$onAction(({ after, onError }) => {
  // 大多数 action 是一个 promise, 我们希望 action 执行之后再执行一些额外的逻辑

  after(() => {
    console.log(store.count)
  })

  onError((err) => {
    console.warn(err)
  })
})
</script>

<template>
  <div>计数器：{{ store.count }}</div>
  <div>双倍：{{ store.double }}</div>
  <button @click="increment(2)">累加</button>

  <button @click="patch">同时多次修改状态</button>
  <button @click="reset">重置</button>
</template>

<style scoped></style>
