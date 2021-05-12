## part1.4 高頻考點

### 数据类型
* null
* undefined
* boolean
* number
* string
* object(含function、array、date)
* symbol

### 类型判断
* typeof
* instanceof
* Object.prototype.toString
* constructor

#### typeof
```javaScript
// 基础类型
typeof 5 // "number"
typeof 'lucas' // "string"
typeof undefined // "undefined"
typeof true // "boolean"
typeof null // "object"

// 复杂类型
const foo = () => 1
typeof foo // "function"

const foo = {}
typeof foo // "object"

const foo = []
typeof foo // "object"

const foo = new Date()
typeof foo // "object"

const foo = Symbol("foo")
typeof foo // "symbol"
```
使用 typeof 可以判断出除 null 以外的基本类型，以及 function 类型、symbol 类型

#### instanceof
使用 a instanceof B 判断的是：a 是否为 B 的实例，即 a 的原型链上是否存在 B 构造函数

```javaScript
5 instanceof Number // false
// 5 是基本类型，它并不是 Number 构造函数构造出来的实例

new Number(5) instanceof Number // true

// L 表示左表达式，R 表示右表达式
const instanceofMock = (L, R) => {
   if (typeof L !== 'object') {
       return false
   }
   while (true) {
       if (L === null) {
           // 已经遍历到了最顶端
           return false
       }
       if (R.prototype === L.__proto__) {
           return true
       }
       L = L.__proto__
   }
}
```

#### Object.prototype.toString 
万能方法

```javaScript
console.log(Object.prototype.toString.call(1))
// [object Number]

console.log(Object.prototype.toString.call('lucas'))
// [object String]

console.log(Object.prototype.toString.call(undefined))
// [object Undefined]

console.log(Object.prototype.toString.call(true))
// [object Boolean]

console.log(Object.prototype.toString.call({}))
// [object Object]

console.log(Object.prototype.toString.call([]))
// [object Array]

console.log(Object.prototype.toString.call(function(){}))
// [object Function]

console.log(Object.prototype.toString.call(null))
// [object Null]

console.log(Object.prototype.toString.call(Symbol('lucas')))
// [object Symbol]
```

#### constructor 
返回构造函数
```javaScript
var foo = undefined
foo.constructor
// VM257:1 Uncaught TypeError: Cannot read property 'constructor' of undefined

var foo = null
foo.constructor
// VM334:1 Uncaught TypeError: Cannot read property 'constructor' of null
```
对于 undefined 和 null，如果尝试读取其 constructor 属性，将会进行报错

### 类型转换
* 如果 + 号两边存在 NaN，则结果为 NaN（typeof NaN 是 'number'）
* 如果是 Infinity + Infinity，结果是 Infinity
* 如果是 -Infinity + (-Infinity)，结果是 -Infinity
* 如果是 Infinity + (-Infinity)，结果是 NaN
* 如果 + 号两边都是字符串，则执行字符串拼接
* 如果 + 号两边只有一个值是字符串，则将另外的值转换为字符串，再执行字符串拼接
* 如果 + 号两边有一个是对象，则调用 valueof() 或者 toStrinig() 方法取得值，转换为基本类型再进行字符串拼接。

### 函数参数传递
* 参数为基本类型时，函数体内复制了一份参数值，对于任何操作不会影响参数实际值
* 函数参数是一个引用类型时，当在函数体内修改这个值的某个属性值时，将会对参数进行修改
* 函数参数是一个引用类型时，如果我们直接修改了这个值的引用地址，则相当于函数体内新创建了一份引用，对于任何操作不会影响原参数实际值

```javaScript
let foo = 1
const bar = value => {
   value = 2
   console.log(value)
}
bar(foo)
console.log(foo)

let foo = {bar: 1}
const func = obj => {
   obj.bar = 2
   console.log(obj.bar)
}
func(foo)
console.log(foo)

let foo = {bar: 1}
const func = obj => {
   obj = 2
   console.log(obj)
}
func(foo)
console.log(foo)
```