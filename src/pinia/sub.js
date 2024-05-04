// 订阅
export function addSubscription(subscriptions, callback) {
  // 将回调放入队列中
  subscriptions.push(callback)

  const removeSubscription = () => {
    const idx = subscriptions.indexOf(callback)
    if (idx > -1) {
      subscriptions.splice(idx, 1)
    }
  }
  return removeSubscription
}

// 发布
export function triggerSubscription(subscriptions, ...args) {
  subscriptions.slice().forEach((cb) => cb(...args))
}
