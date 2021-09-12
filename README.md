# `@vuepress/plugin-posts-encrypt`

> **A vuepress plugin for encrypting your posts**

## Install

```sh
yarn add @vuepress/plugin-posts-encrypt
```
## Usage

###  Step 1: Init configuration in vuepress config file

👇[All configuration](#Configs) items can be seen below👇

``` js
// .vuepress/config.js
module.exports = {

  // other options...
  plugins: [
    [
      '@vuepress/plugin-posts-encrypt',
      {
        route: '/auth',
        passwd: '123456',
        encryptInDev: true,
        expires: 1000  * 60
      }
    ]
}
```
### Step 2: Configure the posts that need to be encrypted in the blog

- Set `secret: true` in the article that needs to be encrypted

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
- At the same time, you can also set a different password by `passwd` field for each article

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

`Thats it!` 🚀🚀🚀

### Step3: Let's take a look at the effect together

- need set `encryptInDev: true` in the development environment

```sh
vuepress dev docs 
```

<video src="./.github/img/demo.mp4" controls="controls" width="500" height="300"></video>

## Configs
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
  injectConfig: { // 自定义模板时，需要注入的外部资源配置
    less: '',
    iview: false,
    animate: false
  }
}
```
