## part1.1 this
this 强大灵活同时很多隐蔽的 bug 都缘于它

### 规律：
* 简单调用函数时，严格模式是undefined，非严格模式会绑定到 window／global
* new调用构造函数，构造函数内的this会被绑定到新创建的对象上
* 通过 call/apply/bind 函数时，this会绑定到指定参数的对象上
* 通过上下文对象调用，this会绑定到该对象上
* 箭头函数，this由外层作用域来决定
一句话总结：this 的指向，是在调用函数时根据执行上下文所动态确定的

### 全局环境下的 this
```javaScript
const foo = {
    bar: 10,
    fn: function() {
       console.log(this)
       console.log(this.bar)
    }
}
foo.fn()
// {bar: 10, fn: ƒ}
// 10

var fn1 = foo.fn
fn1()
// 相当于输出
// console.log(window)
// console.log(window.bar)
```
在执行函数时，如果函数中的 this 是被上一级的对象所调用，那么 this 指向的就是上一级的对象，否则指向全局环境

### 上下文对象调用中的 this
```javaScript
const o1 = {
    text: 'o1',
    fn: function() {
        return this.text
    }
}
const o2 = {
    text: 'o2',
    fn: function() {
        return o1.fn()
    }
}
const o3 = {
    text: 'o3',
    fn: function() {
        var fn = o1.fn
        return fn()
    }
}

console.log(o1.fn())
console.log(o2.fn())
console.log(o3.fn())
// o1、o1、undefined
```
* 第二个 console 的 o2.fn()，最终还是调用 o1.fn()，因此答案仍然是 o1。
* 最后一个，在进行 var fn = o1.fn 赋值之后，是“裸奔”调用，因此这里的 this 指向 window

#### 不使用 bind/call/apply，使o2输出o2
```javaScript
const o1 = {
    text: 'o1',
    fn: function() {
        return this.text
    }
}
const o2 = {
    text: 'o2',
    fn: o1.fn
}

console.log(o2.fn())
```
this 指向最后调用它的对象，在 fn 执行时，挂到 o2 对象上

### bind/apply/call改变this的指向
改变相关函数 this 指向

```javaScript
const target = {}
fn.call(target, 'arg1', 'arg2')

// 相当于
const target = {}
fn.apply(target, ['arg1', 'arg2'])

// 相当于
const target = {}
fn.bind(target, 'arg1', 'arg2')()

// 例子
const foo = {
    name: 'lucas',
    logName: function() {
        console.log(this.name)
    }
}
const bar = {
    name: 'mike'
}
console.log(foo.logName.call(bar))
// mike
```

### 构造函数和 this
```javaScript
function Foo() {
    this.bar = "Lucas"
}
const instance = new Foo()
console.log(instance.bar)
```

#### new做了什么？
* 创建一个新的对象
* 把构造函数的this指向这个对象
* 给对象添加属性和方法等
* 返回新的对象

```javaScript
var obj={}
obj.__proto__=Foo.prototype
Foo.call(obj)
```

```javaScript
function Foo(){
    this.user = "Lucas"
    const o = {}
    return o
}
const instance = new Foo()
console.log(instance.user)
// undefined

function Foo(){
    this.user = "Lucas"
    return 1
}
const instance = new Foo()
console.log(instance.user)
// Lucas
```
如果构造函数中显式返回一个值，且返回的是一个对象，那么 this 就指向这个返回的对象；如果返回的不是一个对象，那么 this 仍然指向实例

### 箭头函数中的 this 指向
箭头函数使用 this 不适用以上标准规则，而是根据外层（函数或者全局）上下文来决定
```javaScript
const foo = {  
    fn: function () {  
        setTimeout(() => {  
            console.log(this)
        })
    }  
} 
console.log(foo.fn())

// {fn: ƒ}
```

### this 优先级
通过 call、apply、bind、new 对 this 绑定的情况称为显式绑定；根据调用关系确定的 this 指向称为隐式绑定；那么谁的优先级更高呢？
```javaScript
function foo (a) {
    console.log(this.a)
}

const obj1 = {
    a: 1,
    foo: foo
}

const obj2 = {
    a: 2,
    foo: foo
}

obj1.foo.call(obj2)
obj2.foo.apply(obj1)
// 输出分别为 2、1，也就是说 call、apply 的显式绑定一般来说优先级更高

function foo (a) {
    this.a = a
}

const obj1 = {}

var bar = foo.bind(obj1)
bar(2)
console.log(obj1.a)
// 通过 bind，将 bar 函数中的 this 绑定为 obj1 对象。执行 bar(2) 后，obj1.a 值为 2。即经过 bar(2) 执行后，obj1 对象为：{a: 2}

var baz = new bar(3)
console.log(baz.a)
// 3
// new 绑定修改了 bind 绑定中的 this，因此 new 绑定的优先级比显式 bind 绑定更高

function foo() {
    return a => {
        console.log(this.a)
    };
}

const obj1 = {
    a: 2
}

const obj2 = {
    a: 3
}

const bar = foo.call(obj1)
console.log(bar.call(obj2))
// 2
// 由于 foo() 的 this 绑定到 obj1，bar（引用箭头函数）的 this 也会绑定到 obj1，箭头函数的绑定无法被修改

// 如果将 foo 完全写成箭头函数的形式
var a = 123
const foo = () => a => {
    console.log(this.a)
}

const obj1 = {
    a: 2
}

const obj2 = {
    a: 3
}

var bar = foo.call(obj1)
console.log(bar.call(obj2))
// 123
```