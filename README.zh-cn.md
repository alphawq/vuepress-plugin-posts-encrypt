简体中文 | [English](./README.md)

# `vuepress-plugin-posts-encrypt`

![npm (tag)](https://img.shields.io/npm/v/vuepress-plugin-posts-encrypt/latest?style=flat-square&color=blue)
![License](https://img.shields.io/npm/l/vuepress-plugin-posts-encrypt?style=flat-square&color=red&label=License)
![npm downloads](https://img.shields.io/npm/dt/vuepress-plugin-posts-encrypt?style=flat-square&label=Downloads)
[![Blog](https://img.shields.io/badge/blog-@alphawq-blue.svg?style=social)](https://alphawq.github.io/_blog/)

> **一个用于为你的博客添加 `访问验证` 功能的 `vuepress` 插件。**

## 安装

```sh
yarn add vuepress-plugin-posts-encrypt
```

## Usage 使用

### Step 1: 在 `.vuepress/config.js` 中初始化配置

```js
// .vuepress/config.js
module.exports = {

  // other options...
  plugins: [
    [
      'posts-encrypt',
      {
        route: '/auth',
        passwd: '123456',
        encryptInDev: true,
        expires: 1000  * 60
      }
    ]
}
```

> 👇[所有配置项](#配置项) 参见下方 `Configs` 部分 👇

### Step 2: 配置博客中需要加密访问的文章

- 在需要加密访问的文章的 [Front Matter](https://vuepress.vuejs.org/zh/guide/frontmatter.html#%E5%85%B6%E4%BB%96%E6%A0%BC%E5%BC%8F%E7%9A%84-front-matter) 中设置 `secret: true`

```yml
---
title: A Private Post
date: 2021-09-03
categories:
  - Profile
tags:
  - resume
secret: true
---
```

- 同时，你也可以通过 `passwd` 配置来为每篇文章单独设置不同的密码

```yml
---
title: A Private Post
date: 2021-09-03
categories:
  - Profile
tags:
  - resume
secret: true
passwd: 1233211234567
---
```

`就是这样！` 🚀🚀🚀

### Step3: 运行起来看下效果吧

_BTW_： **开发环境下，还需要配置 `encryptInDev: true`**

执行如下命令，启动开发服务，

```sh
vuepress dev docs
```

点击进入一个需要验证密码的页面，就可以看到如下效果：

<img src="./.github/img/demo.gif" width="300"></img>

## 配置项

### 支持自定义模板

自定义模板的场景下，插件需要向你的模板文件中注入部分逻辑，如：`密码校验` 相关的逻辑。所以需要在模板中提供注入这部分代码的标记。

以下标记除了 **`<%validate_js_tag%>` & `<%crypto_inject_tag%>`** 之外，其他都是可选的，你可以自由选择：

_BTW_：**以下标记都是自上而下依次插入到模板中的，所以需要额外注意标记的书写位置**

模板中内容注入的位置标记包括如下几种

#### `<%iview_css_tag%>` 【非必须】

> [`iView`](https://www.iviewui.com/docs/introduce) 组件库 `CSS` 资源注入位置标记

- 需要在 `injectConfig` 配置中设置 `iview: true`

#### `<%animate_css_tag%>` 【非必须】

> [`Animate.css`](https://animate.style/) 注入位置标记

- 需要在 `injectConfig` 配置中设置 `animate: true`

#### `<%iview_js_tag%>` 【非必须】

> [`iView`](https://www.iviewui.com/docs/introduce) 组件库 `JS` 注入位置标记

- 需要在 `injectConfig` 配置中设置 `iview: true`

#### `<%minified_css_tag%>` 【非必须】

> 外部 `less` 文件编译后的注入位置标记

- 如果你不想在模板里面写 `css`，这个配置可以允许你将模板中需要用到的样式文件单独抽离到 `less` 文件中，插件会帮你 `编译并插入` 到对应位置。
  你只需要在 `injectConfig` 的 `less` 设置中指定样式文件的绝对路径即可

#### `<%crypto_inject_tag%>` 【必须】

> [`CryptoJS`](https://github.com/brix/crypto-js) 脚本文件插入位置

#### `<%validate_js_tag%>` 【必须】

> **密码校验**以及**已验证路由的存储**相关逻辑的注入位置标记

### 支持设置密码过期时间

默认情况下，已验证通过的路由在同一台设备同一个浏览器且用户没有清理本地缓存的情况下，下次进来是不需要再次进行验证的，因为是存储在 `localstorage` 中的

如果你不想这样的话，可以为密码设置 `expires`，单位是`毫秒（ms）`。这个过期时间是针对每个路由而言的，而不是所有路由。

_BTW_: **过期时间不要设置得过短，否则可能会造成路由死循环**

### 以下是支持的所有配置选项：

```ts
interface InjectConfig {
  // 自定义模板外联的less文件地址
  less?: string
  // 是否注入IView组件库，默认 false
  iview?: boolean
  // 是否注入anmitecss动画库，默认 false
  animate?: boolean
}

interface Options {
  // 验证页面的路由地址， 默认`/auth`
  route?: string
  // 默认密码
  passwd: string
  // 自定义密码验证模板
  template?: string
  // 开发环境是否加密，默认 false
  encryptInDev?: boolean
  // 密码过期时间，默认永久有效，单位：ms
  expires?: number
  // 自定义模板时是否需要注入其他资源
  injectConfig?: InjectConfig
}

const options: Options = {
  route: '/auth', // 默认的验证页路由，最终路由会拼接上用户的 base 配置
  passwd: 'hello world', // 默认密码 `hello world`
  template: '', // 自定义模板的文件路径，不指定则使用默认模板
  encryptInDev: false, // 开发模式下是否开启文章加密（可用于预览）， 默认 false
  expires: 0, // 密码过期时间，默认永不过期
  injectConfig: {
    // 自定义模板时，需要注入的外部资源配置
    less: '',
    iview: false,
    animate: false
  }
}
```

👏👏 **One key triple connection** 👏👏
## Changelog

[CHANGELOG.md](./CHANGELOG.md)

## License

**[MIT](./LICENSE)**
