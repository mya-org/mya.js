# mya.js

A base library including module loader & data center for mya.

## 简介

mya 项目基础库，包含模块加载器和简单的数据中心。

## 模块加载器

https://github.com/mya-org/mod

## 数据中心

提供全局的 `__M.get`、`__M.set`、`__M.context` 方法，用于读写全局数据。

* `__M.get(key)`: key 为字符串，获取对应key的值，如果值为对象或数据，则获取值的深拷贝
* `__M.set(key, value)`: key 为字符串，设置对应key的值
* `__M.context()`: 获取全局数据的一份深拷贝
* `__M.context(data)`: data 为对象，覆盖全局数据

**注意**

* 调用 `__M.get(key)` 会深拷贝一份数据，所以如果要修改和覆盖原数据，必须通过 `__M.set(key, value)`
* 调用 `__M.context(data)` 会直接覆盖全局数据，需要谨慎使用。建议使用时先 `__M.context()` 获取数据，操作完数据后，再通过 `__M.context(data)` 覆盖。