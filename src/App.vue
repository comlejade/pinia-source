<script setup>
import { useCounterStore } from './stores/counter'

const store = useCounterStore()

console.log(store)

const { increment } = store
</script>

<template>
  <div>计数器：{{ store.count }}</div>
  <div>双倍：{{ store.double }}</div>
  <button @click="increment(2)">累加</button>
</template>

<style scoped></style>
