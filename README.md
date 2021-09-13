# `@vuepress/plugin-posts-encrypt`

> **A vuepress plugin for encrypting your posts**

## Install 安装

```sh
yarn add @vuepress/plugin-posts-encrypt
```
## Usage 使用

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

### Step3: Let's take a look at the effect（看下效果吧）

need set `encryptInDev: true` in the development environment（开发环境下，需要设置 `encryptInDev: true`）

执行如下命令，启动开发服务，

```sh
vuepress dev docs 
```

点击进入一个需要验证密码的页面，就可以看到如下效果：

<img src="./.github/img/demo.gif" width="300"></img>

## Configs

### Support custom templates（支持自定义模板）

自定义模板的场景下，插件需要向你的模板文件中注入部分逻辑，如：`密码校验` 相关的逻辑。所以需要在模板中提供注入这部分代码的标记。以下标记并不都是必须的（**除了`<%validate_js_tag%>` & `<%crypto_inject_tag%>`**），你可以自由选择：

(In the custom template scenario, the plug-in needs to inject some logic into your template file, such as the logic related to password verification. So you need to provide a mark to inject this part of the code in the template. Not all of the following marks are required but `<%crypto_inject_tag%>` & `<%validate_js_tag%>`, you are free to choose:)

`提示：` **以下标记都是从商到下依次插入到模板中，所以需要注意标记的书写位置**

- 模板中内容注入的位置包括如下几种(The location of content injection in the template includes the following)
  - `<%iview_css_tag%>` `iViewCSS` 组件库注入位置标记 【非必须】
    - 需要在 `injectConfig` 配置中设置 `iview: true`
  - `<%iview_js_tag%>` `iViewJS` 组件库注入位置标记 【非必须】
    - 需要在 `injectConfig` 配置中设置 `iview: true`
  - `<%animate_css_tag%>` `animatecss` 注入位置标记 【非必须】
    - 需要在 `injectConfig` 配置中设置 `animate: true`
  - `<%minified_css_tag%>` 外部 `less` 文件编译后的注入位置标记【非必须】
    - 如果你不想在模板里面写 `css`，这个配置可以允许你将模板中需要用到的样式文件单独抽离到 `less` 文件中，插件会帮你`编译并插入`到对应位置
    - 如果，要在 `injectConfig` 中设置 `less` 样式文件的绝对路径
  - `<%crypto_inject_tag%>` `CryptoJS` 脚本文件插入位置 【必须】
  - `<%validate_js_tag%>` **密码校验**以及**已验证路由的存储**相关逻辑的注入位置标记 【必须】
### 支持设置密码过期时间

默认情况下，已验证通过的路由在同一台设备同一个浏览器且用户没有清理本地缓存的情况下，下次进来是不需要再次进行验证的，因为是存储在 `localstorage` 中的

如果你不想这样的话，可以为密码设置 `expires`，单位是`毫秒（ms）`。这个过期时间是针对每个路由而言的，而不是所有路由。

`提示:` **过期时间不要设置得过短，否则可能会造成路由死循环**

以下是支持的所有配置选项：

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
👏👏 **One key triple connection** 👏👏
