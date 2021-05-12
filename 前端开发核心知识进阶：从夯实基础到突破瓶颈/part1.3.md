## part1.3 常用api
典型的 API

### 「如何获取文档中任意一个元素距离文档 document 顶部的距离？」
* 通过递归实现
* 通过 getBoundingClientRect API 实现

```javaScript
const offset = ele => {
   let result = {
       top: 0,
       left: 0
   }

const getOffset = (node, init) => {
       if (node.nodeType !== 1) {
           return
       }

       position = window.getComputedStyle(node)['position']

       if (typeof(init) === 'undefined' && position === 'static') {
           getOffset(node.parentNode)
           return
       }

       result.top = node.offsetTop + result.top - node.scrollTop
       result.left = node.offsetLeft + result.left - node.scrollLeft

       if (position === 'fixed') {
           return
       }

       getOffset(node.parentNode)
   }

   // 当前 DOM 节点的 display === 'none' 时, 直接返回 {top: 0, left: 0}
   if (window.getComputedStyle(ele)['display'] === 'none') {
       return result
   }

   let position

   getOffset(ele, true)

   return result

}
```

```javaScript
const offset = ele => {
   let result = {
       top: 0,
       left: 0
   }
   // 当前为 IE11 以下，直接返回 {top: 0, left: 0}
   if (!ele.getClientRects().length) {
       return result
   }

   // 当前 DOM 节点的 display === 'none' 时，直接返回 {top: 0, left: 0}
   if (window.getComputedStyle(ele)['display'] === 'none') {
       return result
   }

   result = ele.getBoundingClientRect()
   var docElement = ele.ownerDocument.documentElement

   return {
       top: result.top + window.pageYOffset - docElement.clientTop,
       left: result.left + window.pageXOffset - docElement.clientLeft
   }
}
```
<!-- node.ownerDocument.documentElement 的用法可能大家比较陌生，ownerDocument 是 DOM 节点的一个属性，它返回当前节点的顶层的 document 对象。ownerDocument 是文档，documentElement 是根节点 -->

### compose 
* compose 的参数是函数数组，返回的也是一个函数
* compose 的参数是任意长度的，所有的参数都是函数，执行方向是自右向左的，因此初始函数一定放到参数的最右面
* compose 执行后返回的函数可以接收参数，这个参数将作为初始函数的参数，所以初始函数的参数是多元的，初始函数的返回结果将作为下一个函数的参数，以此类推。因此除了初始函数之外，其他函数的接收值是一元的

```javaScript
// compose
fn1(fn2(fn3(fn4(args))))

// pipe
fn4(fn3(fn2(fn1(args))))

// 实现用到闭包
const compose = function(...args) {
   let length = args.length
   let count = length - 1
   let result
   return function f1 (...arg1) {
       result = args[count].apply(this, arg1)
       if (count <= 0) {
           count = length - 1
           return result
       }
       count--
       return f1.call(null, result)
   }
}

// lodash 版本
var compose = function(funcs) {
   var length = funcs.length
   var index = length
   while (index--) {
       if (typeof funcs[index] !== 'function') {
           throw new TypeError('Expected a function');
       }
   }
   return function(...args) {
       var index = 0
       var result = length ? funcs.reverse()[index].apply(this, args) : args[0]
       while (++index < length) {
           result = funcs[index].call(this, result)
       }
       return result
   }
}

// Redux 版本
function compose(...funcs) {
   if (funcs.length === 0) {
       return arg => arg
   }

   if (funcs.length === 1) {
       return funcs[0]
   }

   return funcs.reduce((a, b) => (...args) => a(b(...args)))
}
```
函数式概念确实有些抽象，需要开发者仔细琢磨，并动手调试。一旦顿悟，必然会感受到其中的优雅和简洁