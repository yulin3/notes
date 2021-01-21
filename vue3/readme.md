# [Vue3](https://github.com/vuejs/vue-next "Vue3")响应式原理分析
Vue的一个核心就是数据响应式，通过侦测数据的变化，来驱动更新视图

## 前言
### Vue2 响应式实现方式
遍历对象所有属性并使用 Object.defineProperty 重新定义getter/setter进行劫持  
需要对 Object 和 Array 两种类型采用不同的处理方式  
Object 类型需要递归侦测对象所有的 key，来实现深度的侦测  
而为了感知 Array 的变化，则是对 Array 原型上几个改变数组自身的方法做了拦截  

缺点:  
* 无法监听对象以及数组动态添加的属性
* 实现不够方便
* 性能问题

### Vue3 响应式实现方式
使用es6 API Proxy  
相比旧的 defineProperty API ，Proxy 可以代理数组，并且 API 提供了多个 traps(捕获器)  
今天主要講怎么使用proxy实现响应式对象  

## [Proxy](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy "Proxy")
### Proxy 用于创建一个对象的代理，从而实现基本操作的拦截和自定义
代理很好理解，就像科学上网一样，中間包了一层，你可以为所欲为

### Proxy 细节一：默认行为
```javaScript
let o = { handsome: 'gong' }
let p = new Proxy(o, {
  get(target, key, receiver) {
    return target[key]
  },

  set(target, key, value, receiver) {
    console.log('set value')
    target[key] = value
  }
})

p.hansome = 'yuanqi'
// set value

// 当代理对象是数组
let handsome = ['gong', 'li']
let p = new Proxy(handsome, {
  get(target, key, receiver) {
    console.log('get value:', key)
    return target[key]
  },

  set(target, key, value, receiver) {
    console.log('set value:', key, value)
    target[key] = value
    // return true
  }
})

p.push('yuanqi') // VM438:12 Uncaught TypeError: 'set' on proxy: trap returned falsish for property '2'
```
push 操作，并不只是操作当前数据，push 操作还触发数组本身其他属性更改 导致set不能正常获取返回值

## [Reflect](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Reflect "Reflect")
是一个内置的对象，它提供拦截 JavaScript 操作的方法  
通過 Reflect 規範默認行為

```javaScript
let handsome = ['gong', 'li']
let p = new Proxy(handsome, {
  get(target, key, receiver) {
    console.log('get value:', key)
    return Reflect.get(target, key, receiver)
  },

  set(target, key, value, receiver) {
    console.log('set value:', key, value)
    return Reflect.set(target, key, value, receiver)
  }
})

p.push('yuanqi')
```
相比自己处理 set 的默认行为，Reflect 则更方便优雅

### Proxy 细节二：多次触发 set/get
当代理对象是数组时，数组操作会触发多次 set 执行，同时也引发 get 操作

```javaScript
let handsome = ['gong', 'li']
let p = new Proxy(handsome, {
  get(target, key, receiver) {
    console.log('get value:', key)
    return Reflect.get(target, key, receiver)
  },

  set(target, key, value, receiver) {
    console.log('set value:', key, value)
    return Reflect.set(target, key, value, receiver)
  }
})

p.push('yuanqi')
```
假设set 中的 console 是触发外界渲染的 render 函数，那么 push 操作会引发多次 render 

### Proxy 细节三：只能代理一层
```javaScript
let handsome = { product: 'hao', yu: ['sugar'], fe: {big: 'gong', small: 'li'} }
let p = new Proxy(handsome, {
  get(target, key, receiver) {
    console.log('get value:', key)
    return Reflect.get(target, key, receiver)
  },

  set(target, key, value, receiver) {
    console.log('set value:', key, value)
    return Reflect.set(target, key, value, receiver)
  }
})

p.yu.push('honey')
p.fe.small = 'yuanqi'

// get value: yu
// get value: fe
```
可以看到并没有触发 set 的，反而是触发了 get ，因为 set 的过程中访问了 yu 这个属性
由此可见，proxy 代理的对象只能代理到第一层，而对象内部的深度侦测，需要另行实现


## 问题總結
1. set 会多次执行并导致重复渲染
2. proxy 对象只能代理一层
先自己尝试解决这些问题，再對比 Vue3 的解决方式

### setTimeout ，类似于 debounce 的操作，解决多次执行
```javaScript
function reactive(data, cb) {
  let timer = null

  return new Proxy(data, {
    get(target, key, receiver) {
      return Reflect.get(target, key, receiver)
    },

    set(target, key, value, receiver) {
      clearTimeout(timer)
      timer = setTimeout(() => {
        cb && cb()
      }, 0) // 通過定時器放到事件隊列

      return Reflect.set(target, key, value, receiver)
    }
  })
}

let handsome = ['gong', 'li']
let p = reactive(handsome, () => {
  console.log('trigger')
  // 打印 trigger 来模拟通知外部数据的变化
})

p.push('yuanqi')
// trigger
```

### 递归解决数据深度侦测
```javaScript
function reactive(data, cb) {
  let o = null
  let timer = null

  o = data instanceof Array ? []: {} 

  for (let key in data) {
    if (typeof data[key] === 'object') {
      o[key] = reactive(data[key], cb)
    } else {
      o[key] = data[key]
    }
  }

  return new Proxy(o, {
    get(target, key) {
      return Reflect.get(target, key)
    },

    set(target, key, val) {
      let res = Reflect.set(target, key, val)
      clearTimeout(timer)
      timer = setTimeout(() => {
        cb && cb()
      }, 0)
      return res
    }
  })
}

let handsome = { product: 'hao', yu: ['sugar'], fe: {big: 'gong', small: 'li'} }
let p = reactive(handsome, () => {
  console.log('trigger')
})

p.yu.push('honey')
p.fe.small = 'yuanqi'
// trigger
```
对象进行遍历，对每个 key 都做一次 proxy  
输出代理后的对象 p 可以看到深度代理后的对象，都携带 proxy 的标志  

虽然这些处理方式可以解决问题，但并不够优雅，尤其是递归 proxy 是一个性能隐患，并且有些数据并非需要侦测  
接下来我们就看下 Vue3 是如何使用 Proxy 实现数据侦测的

## [WeakMap](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/WeakMap "WeakMap")
原生的 WeakMap 持有的是每个键对象的“弱引用”，这意味着在没有其他引用存在时垃圾回收能正确进行

```javaScript
let data = { a: { b: { c: 1 } } }
let p = new Proxy(data, {
  get(target, key, receiver) {
    // receiver 输出的是当前代理对象
    const res = Reflect.get(target, key, receiver)
    console.log(res)
    return res
  },

  set(target, key, value, receiver) {
    return Reflect.set(target, key, value, receiver)
  }
})

p.a // {b: {c: 1} }
```
当代理的对象是多层结构时，Reflect.get 会返回对象的内层结构

## 问题一：如何避免多次 trigger
```javaScript
function hasOwn(val, key) {
  const hasOwnProperty = Object.prototype.hasOwnProperty
  return hasOwnProperty.call(val, key)
}

function set(target, key, val, receiver) {
  console.log(target, key, val)
  const hadKey = hasOwn(target, key)
  const oldValue = target[key]
  
  val = reactiveToRaw.get(val) || val
  const result = Reflect.set(target, key, val, receiver)

  if (!hadKey) { // 新增
    console.log('trigger ... is a add OperationType')
  } else if(val !== oldValue) { // 更新
    console.log('trigger ... is a set OperationType')
  }

  return result
}
```
通过 判断 key 是否为 target 自身属性，以及设置val是否跟target[key]相等 
可以确定 trigger 的类型，并且避免多余的 trigger

## 问题二：深度侦测数据
```javaScript
function createGetter() {
  return function get(target, key, receiver) {
    const res = Reflect.get(target, key, receiver)
    return isObject(res) ? reactive(res) : res
  }
}
```
利用 Reflect.get() 返回的“多层级对象中内层” ，再对“内层数据”做一次代理  
判断 Reflect 返回的数据是对象，则再走一次 proxy ，从而获得了对对象内部的侦测  
每一次的 proxy 数据，都会保存在 Map 中，访问时会直接从中查找，从而提高性能  

总结
Vue3是如何侦测数据的  
<!-- Vue3 并非简单的通过 Proxy 来递归侦测数据， 而是通过 get 操作来实现内部数据的代理（时机合理），并且结合 WeakMap 来对数据保存，这将大大提高响应式数据的性能 -->