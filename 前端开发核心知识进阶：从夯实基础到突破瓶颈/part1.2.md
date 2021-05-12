## part1.2 闭包
函数a内部有函数b，b可以访问到a的变量，那么函数b就是闭包

### 作用域
在特定场景下如何查找变量的規則

JavaScript 执行一段函数时，遇见变量读取其值，这时候会“就近”先在函数内部找该变量的声明或者赋值情况。这里涉及“变量声明方式”以及“变量提升”的知识点，我们后面会涉及到。如果在函数内无法找到该变量，就要跳出函数作用域，到更上层作用域中查找
，一直到全局作用域

### 作用域链
变量作用域的查找是一个扩散过程，就像各个环节相扣的链条，逐次递进，这就是作用域链

### 块级作用域和暂时性死区
```javaScript
function foo() {
    console.log(bar)
    let bar = 3
}
foo()
// Uncaught ReferenceError: bar is not defined

// 函数的参数默认值设置也会受到 TDZ 的影响
function foo(arg1 = arg2, arg2) {
    console.log(`${arg1} ${arg2}`)
}

foo(undefined, 'arg2')

// Uncaught ReferenceError: arg2 is not defined
```
我们知道使用 let 或 const 声明变量，会针对这个变量形成一个封闭的块级作用域，在这个块级作用域当中，如果在声明变量前访问该变量，就会报 referenceError 错误

### 执行上下文
当前代码的执行环境/作用域

#### JavaScript 执行主要分为两个阶段
* 代码预编译阶段
  + 预编译阶段进行变量声明
  + 预编译阶段变量声明进行提升，但是值为 undefined
  + 预编译阶段所有非表达式的函数声明进行提升
* 代码执行阶段

```javaScript
function bar() {
    console.log('bar1')
}

var bar = function () {
    console.log('bar2')
}

bar()
// bar2 調換順序 仍然是bar2
```
因为在预编译阶段变量 bar 进行声明，但是不会赋值；函数 bar 则进行创建并提升。在代码执行时，变量 bar 才进行（表达式）赋值

```javaScript
foo(10)
function foo (num) {
    console.log(foo)
    foo = num;       
    console.log(foo)
    var foo
} 
console.log(foo)
foo = 1
console.log(foo)
```
作用域在预编译阶段确定，但是作用域链是在执行上下文的创建阶段完全生成的。因为函数在调用时，才会开始创建对应的执行上下文。执行上下文包括了：变量对象、作用域链以及 this 的指向

### 调用栈
执行一个函数时，如果这个函数又调用了另外一个函数，而这个“另外一个函数”也调用了“另外一个函数”，便形成了一系列的调用栈
在函数执行完毕并出栈时，函数内局部变量在下一个垃圾回收节点会被回收，该函数对应的执行上下文将会被销毁，这也正是我们在外界无法访问函数内定义的变量的原因

### 閉包
```javaScript
function numGenerator() {
    let num = 1
    num++
    return () => {
        console.log(num)
    } 
}

var getNum = numGenerator()
getNum()
```
在控制台中可以看到 num 值被标记为 Closure，即闭包变量。

### 内存空间
* 栈空间 基本数据类型，如 Undefined、Null、Number、Boolean、String 等 由操作系统自动分配释放
* 堆空间 引用类型，如 Object、Array、Function 等 一般由开发者分配释放

### 内存泄漏
指内存空间明明已经不再被使用，但由于某种原因并没有被释放的现象
```javaScript
var element = document.getElementById("element")
element.mark = "marked"

// 移除 element 节点
function remove() {
    element.parentNode.removeChild(element)
}

// 我们只是把 id 为 element 的节点移除，但是变量 element 依然存在，该节点占有的内存无法被释放
// element = null


var element = document.getElementById('element')
element.innerHTML = '<button id="button">点击</button>'

var button = document.getElementById('button')
button.addEventListener('click', function() {
    // ...
})

element.innerHTML = ''
// 由于其事件处理句柄还在，所以依然无法被垃圾回收
```
如果我们不知道有问题的代码位置，具体如何找出风险点，那需要在 Chrome memory 标签中，对 JS heap 中每一项，尤其是 size 较大的前几项展开调查


```javaScript
const foo = (function() {
   var v = 0
   return () => {
       return v++
   }
}())

for (let i = 0; i < 10; i++) {
   foo()
}

console.log(foo())
// 10

var fn = null
const foo = () => {
   var a = 2
   function innerFoo() {
       console.log(a)
   }
   fn = innerFoo    
}

const bar = () => {
   fn()
}

foo()
bar()
// 2
// 但是通过 innerFoo 函数赋值给 fn，fn 是全局变量，这就导致了 foo 的变量对象 a 也被保留了下来
```

### 如何利用闭包实现单例模式
保证一个类只有一个实例，并提供一个访问它的全局访问点
```javaScript
function Person() {
   this.name = 'lucas'
}

const getSingleInstance = (function(){
    var singleInstance
   return function() {
        if (singleInstance) {
            return singleInstance
        }
       return singleInstance = new Person()
   }
})()

const instance1 = new getSingleInstance()
const instance2 = new getSingleInstance()
```