const rawToReactive = new WeakMap()
const reactiveToRaw = new WeakMap()
// rawToReactive 和 reactiveToRaw 是两个弱引用的 Map 结构，这两个 Map 用来保存 原始数据 和 可响应数据

// utils
function isObject(val) {
  return typeof val === 'object'
}

function hasOwn(val, key) {
  const hasOwnProperty = Object.prototype.hasOwnProperty
  return hasOwnProperty.call(val, key)
}

// traps
function createGetter() {
  return function get(target, key, receiver) {
    const res = Reflect.get(target, key, receiver)
    return isObject(res) ? reactive(res) : res
  }
}

function set(target, key, val, receiver) {
  console.log(target, key, val)
  const hadKey = hasOwn(target, key)
  const oldValue = target[key]

  val = reactiveToRaw.get(val) || val
  const result = Reflect.set(target, key, val, receiver)

  if (!hadKey) {
    console.log('trigger')
  } else if(val !== oldValue) {
    console.log('trigger')
  }

  return result
}

// handler
const mutableHandlers = {
  get: createGetter(),
  set: set,
}

// entry
function reactive(target) {
  return createReactiveObject(
    target,
    rawToReactive,
    reactiveToRaw,
    mutableHandlers,
  )
}

// 除了保存了代理的数据和原始数据，createReactiveObject 函数仅仅是返回了 new Proxy 代理后的对象
// 重点在 new Proxy 中传入的handler参数 baseHandlers
function createReactiveObject(target, toProxy, toRaw, baseHandlers) {
  let observed = toProxy.get(target)
  // 原数据已经有相应的可响应数据, 返回可响应数据
  if (observed !== void 0) {
    return observed
  }

  // 原数据已经是可响应数据
  if (toRaw.has(target)) {
    return target
  }

  observed = new Proxy(target, baseHandlers)
  toProxy.set(target, observed)
  toRaw.set(observed, target)
  return observed
}

/** ex **/
// let handsome = ['gong', 'li']
// let r = reactive(handsome)
// r.push('yuanqi')

// r.push('yuanqi') 会触发 set 执行两次，一次是值本身 'yuanqi' ，一次是 length 属性设置
// 设置值 'yuanqi' 时，传入的新增索引 key 为 2，target 是原始的代理对象 ['gong', 'li'] 
// hasOwn(target, key) 显然返回 false ，这是一个新增的操作，此时可以执行 trigger ... is a add OperationType 
// 当传入 key 为 length 时，hasOwn(target, key) ，length 是自身属性，返回 true，
// 此时判断 val !== oldValue , val 是 3, 而 oldValue 即为 target['length'] 也是 3，此时不执行 trigger 输出语句