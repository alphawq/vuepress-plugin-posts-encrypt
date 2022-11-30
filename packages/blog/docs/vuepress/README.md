---
title: vuepress 插件原理 以及 如何实现一个博客访问验证插件
categories:
  - Vuepress
tags:
  - Vuepress
  - vuepress-plugin-posts-encrypt
---

---

[[toc]]

---

# 背景

最近在写博客的时候有这样一个需求：**_有些博客内容想要通过密码验证的方式来允许别人访问_**。

试想一下这样的场景：

> 比如你的个人简历是维护在线上博客的，博客的其他内容所有人都可以访问，但是像简历这种涉及个人信息的内容，就需要通过一种验证机制来限制所有人访问。假如你在寻找新的工作机会，通过`链接 + 口令`的方式提供给别人自己的简历，是不是也显得极（zhuang）客（bi）了许多。

另一方面，以产品的角度来想，这其实也是变相为你的博客引流的一种方式。

实现上述功能的方法有很多种，如果你的博客刚好也是（或者也想）通过 `vuepress` + `Github Pages` 的方式搭建，那我建议可以继续阅读下去。

我的博客就是使用这种方式构建和部署的，所以遇到这个问题之后，首先就尝试去找是不是 `vuepress` 有相关的插件可以直接拿来用，不过没有找到自己想要的，所以就只好自己动手撸了一个这样的插件。

# [vuepress-plugin-posts-encrypt](https://github.com/alphawq/vuepress-plugin-posts-encrypt)<Badge type="tip" text="v0.0.3" vertical="top" />

## 预览及使用

1. 插件目前已经开源，插件的具体安装以及使用方式可以在[这里](https://github.com/alphawq/vuepress-plugin-posts-encrypt/blob/main/README.zh-cn.md)看到。

2. 想要看效果的话可以直接访问[这个地址](https://alphawq.github.io/_blog/resume/)，密码：`1234`。

3. 或者你也可以 `clone` 下来代码通过下面的方式在本地运行。

- `clone` 代码

```sh
git clone https://github.com/alphawq/vuepress-plugin-posts-encrypt.git
```

- 安装依赖

```sh
cd vuepress-plugin-posts-encrypt && yarn
```

- 启动服务

```sh
yarn dev
```

不出意外的话，应该就可以打开终端里的链接在本地看到效果了。出意外的话，欢迎大家来提 `issue`。😂

代码仓库是使用 [yarn workspaces](https://classic.yarnpkg.com/en/docs/workspaces/)`+`[lerna](https://lerna.js.org/) 多包管理的方式进行维护，也就是常说的 `monorepo`。相关的使用经验，其实也可以总结成一篇文章来记录和分享，这个 日后 再说。

# 实现

以上都是对插件使用上的介绍，如果只是想用这个插件的话，上面的内容已经足够了。关于实现这一部分，其实主要是记录一下开发过程中遇到的一些问题，以及对应的解决方案，并不会聊太多代码实现相关的内容。

同时，如果你也想要开发一个 `vuepress` 插件的话，那接下来的内容可能会对你有所帮助。

<p style="color: red;font-weight: bold">码农码码码字码砖都不容易，有帮助的话，劳烦给个 Star！💋</p>

## 方案一

看官方文档介绍：`VuePress 由两部分组成：第一部分是一个极简静态网站生成器 (opens new window)，它包含由 Vue 驱动的主题系统和插件 API`，第二部分就不用看了。另外，`每一个由 VuePress 生成的页面都带有预渲染好的 HTML，也因此具有非常好的加载性能和搜索引擎优化（SEO）。`

看到这里我不得不打断一下，因为一开始这个加密插件的实现思路就是受到这句话的影响，让我误以为 因为 `vuepress` 构建出来的产物每个 `md` 页面都会生成一个 `html`，因此部署到 `Github Pages` 上之后，它应该是一个 `MPA` 应用，所以一开始的实现方案就很简单粗暴：

- 在构建产物生成之后，将需要加密的 `html` 页面内容加密，然后将密文注入到密码验证的模板里，并重写回文件系统

- 当用户访问到这个页面路由的时候，因为是 `MPA`，所以就会呈现出密码验证模板的内容

- 待用户输入密码并校验通过之后，再解密出原始内容，通过 `document.write` 的方式写回去

这个功能理论上就实现了。但是，实际上，文档中还有后面一句话：

`同时，一旦页面被加载，Vue 将接管这些静态内容，并将其转换成一个完整的单页应用（SPA），其他的页面则会只在用户浏览到的时候才按需加载`。

所以在上述方案实现之后，我部署到线上看效果发现，如果一开始进入的就是这个需要加密访问的页面是没问题的，可一旦不是这种情况，也就是说一旦页面路由被 `vue router` 接管，那就 G 了。。。

## 方案二

既然是单页，那也好办，首先想到就是 `vue router` 的导航守卫，如果可以在 `beforeEnter` 钩子里面加上权限校验，那就能在跳转到需要验证密码的页面之前做拦截，让其重定向到验证页，验证通过后再跳回目标地址就可以了。理论上实现起来应该很容易，接下来就看 `vuepress` 是不是提供给了我们相应的能力。

### vupress 架构

<Shadow-Img src="https://vuepress.vuejs.org/architecture.png" />

这是 `vuepress` 的官方架构图，可以看到 插件 部分是运行在 `node` 端的，这个官方文档里也有说明。那插件运行在 `node` 端，接下来就要思考下面几个问题：

### 问题一： 前端路由是如何生成的？

我们都知道 `vue router` 的实现中依赖浏览器 `history` 的 `popstate` 或者 `hash` 的 `hashchange` 事件监听，所以可以肯定的是，`router` 实例的创建肯定还是在 `Browser` 端运行的。但是 `route` 的生成就不是了，因为 `vuepress` 是根据约定的目录结构来生成最终页面的，在 `vuepress` 的设计理念中称其为 `约定大于配置`。而想要读取文件目录，并生成最终路由 `map` 的话，这部分只能是在 `node` 端进行。

针对这个问题，先来看下 `vuepress@1.x` 的相关实现（**卷起来**）：

`vupress` 也是一个使用 `lerna + yarn workspaces` 的 `monorepo` 项目，`packages` 目录下有三个包，

<Shadow-Img :src="$withBase('/assets/vuepress/1.jpg')" />

其中：

- `@vuepress` 是核心实现
- `docs` 是用 `vuepress` 搭建的 `vuepress` 的官方文档项目
- `vuepress` 是 `CLI` 的实现

这里只需要关注 `@vuepress` 里的实现即可。

<Shadow-Img :src="$withBase('/assets/vuepress/2.jpg')" />

看命名就知道 `core` 目录就是核心逻辑了，其他的基本都是内置的一些插件以及工具包了。

**开发插件的时候，像 `shared-utils` 工具包里的内容我们都是可以拿过来用的**

<Shadow-Img :src="$withBase('/assets/vuepress/3.jpg')" />

`core` 目录里的内容也很简洁，分为 `client` 和 `node`，分别是运行在 `Browser` 和 `node` 环境中的代码模块。完整的实现我们不一一去看，只看核心流程。

#### 1. index.js 入口文件

这里主要就是创建 `App` 实例的逻辑，根据环境不同，调用不同的方法。

- 开发模式下是 `dev`
- 生成模式下是 `build`

可以看到，实例化之后，立即调用了 `process` 方法，该方法内部做了很多事情，捡重点说一下：

```js
// index.js 创建App实例
function createApp(options) {
  return new App(options)
}
// 开发模式
async function dev(options) {
  const app = createApp(options)
  await app.process()
  return app.dev()
}
// 生成模式
async function build(options) {
  const app = createApp(options)
  await app.process()
  return app.build()
}
```

::: warning 友情提示

- 以下涉及到的目录，默认都是在 `core/lib` 目录下
- 代码有删减和变更，为了方便理解

注释中涉及到的 `生命周期` 和 `Option API` 相关的部分，其实就是官方文档中`插件开发`部分提到的，可以在插件内部定义的 API 的分类

- [生命周期 API](https://vuepress.vuejs.org/zh/plugin/life-cycle.html)
- [Option API](https://vuepress.vuejs.org/zh/plugin/option-api.html)
- [Context](https://vuepress.vuejs.org/zh/plugin/context-api.html)其实就是 App 实例，上面挂载了很多属性和方法

:::

#### 2. App 类 - `node/App.js`

```js {6}
class App {
  process() {
    // ======== 1. 初始化 ======== //
    this.pages = [] // Array<Page>
    // 创建 PluginAPI 实例
    this.pluginAPI = new PluginAPI(this)

    // ===== 2. 内部通过调用 this.pluginAPI.use() 方法注册插件 ====== //
    // 先处理内部插件
    this.applyInternalPlugins()
    // 再处理用户插件
    this.applyUserPlugins()

    // ====== 3. 遍历注册完成的插件，将每个插件中涉及到的所有有关 ===== //
    // ====== 生命周期 和 Option API 相关的方法提取出来，存放到 ===== //
    // ====== pluginAPI 实例上的 options 属性中的 items 数组中去 ===== //
    this.pluginAPI.initialize()

    // =========== 这部分是生成 page 的地方 ========= //
    await this.resolvePages()

    // ====== 4. 这里才是真正的通过 key 去调用 插件中定义了这个 [key] 属性的属性值（是function的话，就调用，不是的话直接返回值） //
    await this.pluginAPI.applyAsyncOption('additionalPages', this)
    await Promise.all(
      this.pluginAPI
        .getOption('additionalPages')
        .appliedValues.map(async (options) => {
          await this.addPage(options)
        })
    )
    await this.pluginAPI.applyAsyncOption('ready')
    await Promise.all([
      this.pluginAPI.applyAsyncOption('clientDynamicModules', this),
      this.pluginAPI.applyAsyncOption('enhanceAppFiles', this),
      this.pluginAPI.applyAsyncOption('globalUIComponents', this),
    ])
  }
}
```

首先看下 `process` 方法都做了哪些事情

- 创建了 `pluginAPI` 实例
- 注册 **内部插件**
- 注册 **用户定义的插件**
- 遍历所有注册的插件，并将插件中定义的所有有关 `生命周期` & `Option API` 属性的值，放到 `pluginAPI.options` 对应 `key` 的 `items` 数组里
  - 比如：某个插件中定义了 生命周期 API 里的 `ready` 方法，这个方法就会被存放到 `pluginAPI.options['ready'].items[]` 这个数组里
  - 这一步是的详细操作可以在下面的 `PluginAPI 类` 部分看到

`pluginAPI.options` 的形式如下：

```js
this.pluginAPI.options = {
  // 存储了所有插件中定义的 ready 生命周期 方法
  ready: {
    items: [function ready, function ready]
  },
  // 存储了所有插件中定义的 additionalPages Option API
  additionalPages: {
    items: [function additionalPages, function  additionalPages]
  },
  // ...
}
```

- **生成 `page`, 这部分放到本节最后说**

- 最后，才是通过，如：`this.pluginAPI.applyAsyncOption('additionalPages', this)` 真正的去调用 **所有插件中定义的 `additionalPages` 这个属性的属性值（是 Function 的话，就调用，不是的话直接返回值）**

#### 3. PluginAPI 类 - `plugin-api/index.js`

`PluginAPI` 是插件实例的构造器，它的内部使用到了 `Option` 类以及 `ModuleResolver` 类

```js
// ===== PluginAPI ==== //
class PluginAPI {
  constructor(context) {
    // 这里面是用来存放 Options 实例的，形式大概是下面这样
    this.options = {}
    // 这里面是用来存放经过 this._pluginResolver.resolve 方法处理过后的 plugin 的
    this._pluginQueue = []
    // 它是一个 ModuleResolver 实例，有一个 resolve 方法，用来查找不同类型的模块
    this._pluginResolver = new ModuleResolver(
      'plugin',
      'vuepress',
      [String, Function, Object],
      true /* load module */,
      cwd
    )
    // 根据 PLUGIN_OPTION_MAP 中每个对象的 async 配置，决定是初始化一个 AsyncOption 还是 Option
    this.initializeOptions(PLUGIN_OPTION_MAP)
  }

  /**
   * 通过 resolver 的 resolve 方法将原始的 pluginRaw 标准化成如下形式的一个对象，并把它放到 _pluginQueue 里
   *
   * */
  use() {
    // 标准化
    plugin = this._pluginResolver.resolve(pluginRaw)
    // 这里面存放的是标准化后的 plugin 对象
    this._pluginQueue.push(plugin)
  }

  // 插件的初始化操作
  initialize() {
    this._initialized = true
    this._pluginQueue.forEach((plugin) => this.applyPlugin(plugin))
  }
  /**
   * 从插件对象中结构出来涉及到所有有关 生命周期 & Option
   * 将它们一一定义到 this.options 对象上，
   * this.options 对象是一个 Option 实例，实际上就是放到该实例的 items 数组中去了
   * */
  applyPlugin({
    name: pluginName,
    shortcut,
    ready /*生命周期相关的 hook*/,
    // ...
    enhanceAppFiles /*Options API相关的 */,
    // ...
  }) {
    // 很多个
    this.registerOption(PLUGIN_OPTION_MAP.READY.key, ready, pluginName)
      // ...
      .registerOption(
        PLUGIN_OPTION_MAP.ENHANCE_APP_FILES.key,
        enhanceAppFiles,
        pluginName
      )
      // ...
      .registerOption(
        PLUGIN_OPTION_MAP.CLIENT_DYNAMIC_MODULES.key,
        clientDynamicModules,
        pluginName
      )
    // ...
  }

  /**
   * 将每个插件中涉及到的 插件 API 存储到 this.options 对象的 items 属性中
   * */
  registerOption(key, value, pluginName) {
    let option = [key]
    this.options[option.name].add(pluginName, value)
  }

  // 不同类型的 API 创建不同类型的 Option 实例，EnhanceAppFilesOption、DefineOption等它们都是继承自 Option 的，主要的区别就在于 apply 方法的不同
  initializeOptions() {
    Object.keys(PLUGIN_OPTION_MAP).forEach((key) => {
      const option = PLUGIN_OPTION_MAP[key]
      this.options[option.name] = (function instantiateOption({ name, async }) {
        switch (name) {
          case PLUGIN_OPTION_MAP.ENHANCE_APP_FILES.name:
            return new EnhanceAppFilesOption(name)

          case PLUGIN_OPTION_MAP.CLIENT_DYNAMIC_MODULES.name:
            return new ClientDynamicModulesOption(name)

          case PLUGIN_OPTION_MAP.GLOBAL_UI_COMPONENTS.name:
            return new GlobalUIComponentsOption(name)

          case PLUGIN_OPTION_MAP.DEFINE.name:
            return new DefineOption(name)

          case PLUGIN_OPTION_MAP.ALIAS.name:
            return new AliasOption(name)
          // 不是上面的类型的则根据 async 属性来创建 AsyncOption 或 Option
          default:
            return async ? new AsyncOption(name) : new Option(name)
        }
      })(option)
    })
  }
}
```

- `this.options` 这个对象存放的是 `Option` 实例
- `this._pluginResolver` 这个对象存放的是通过 `ModuleResolver` 类创建的实例
- `use` 方法：
  - 用于把通过 `this._pluginResolver.resolve` 方法标准化处理过后的插件对象存放到 `this._pluginQueue` 这个数组里，标准化处理后的形式如下
  ```js
  {
    // 插件的名称
    name: "@vuepress/internal-routes",
    // 插件中用到的 API
    clientDynamicModules: async clientDynamicModules () {
      const code = importCode(ctx.globalLayout) + routesCode(ctx.pages)
      return { name: 'routes.js', content: code, dirname: 'internal' }
    },
    // 简化名称
    shortcut: null,
    // 是否可用
    enabled: true,
    // 传给插件的参数
    $$options: {},
    // 是否应标准化过了
    $$normalized: true,
    // 是否可以被多次调用，为 false 的话，会被去重处理
    multiple: false
  }
  ```
- `initialize` 方法：

  - 遍历 `this._pluginQueue` 里存储的插件对象，并将插件对象中定义的 有关 `生命周期` 以及 `Option API`（如上面的例子中定义的 `clientDynamicModules` 方法）的内容提取出来
  - 通过下面的形式，`push` 到 `this.options['clientDynamicModules'].items` 数组中去

  ```js
  this.registerOption('CLIENT_DYNAMIC_MODULES', async clientDynamicModules () {
    const code = importCode(ctx.globalLayout) + routesCode(ctx.pages)
    return { name: 'routes.js', content: code, dirname: 'internal' }
  }, '@vuepress/internal-routes')
  ```

上面用到的 `PLUGIN_OPTION_MAP` 大概长这个样子：

```js
const PLUGIN_OPTION_MAP = {
  // 生命周期相关的
  READY: {
    key: 'READY',
    name: 'ready',
    types: [Function],
    async: true,
  },
  // ...

  // Options API 相关的
  ENHANCE_APP_FILES: {
    key: 'ENHANCE_APP_FILES',
    name: 'enhanceAppFiles',
    types: [String, Object, Array, Function],
  },
}
```

- 其中的 `type` 属性是一个数组，表示这个 API 可以接收什么类型的数据，比如
  - `ready` 就只支持 函数类型
  - `enhanceAppFiles` 则支持 字符串、对象、数组、函数多种类型
    这和文档中定义的类型是一一对应的
    <Shadow-Img :src="$withBase('/assets/vuepress/4.jpg')" />
- `async` 属性则是用来标识是创建一个 `AsyncOption` 实例还是一个 `Option` 实例
  - 它俩的主要区别在于插件被真正调用求值的时候，是否需要 `await` 关键字来处理

#### 4. Option 基类 - `plugin-api/abstract/Option.js`

- `add` 方法添加插件
- `apply` 方法调用插件

```js
class Option {
  constructor(key) {
    this.key = key
    this.items = []
  }

  add(name, value) {
    if (Array.isArray(value)) {
      return this.items.push(...value.map((i) => ({ value: i, name })))
    }
    this.items.push({ value, name })
  }

  syncApply(...args) {
    const rawItems = this.items
    this.items = []
    // 被调用求值后的插件对象存放在这里
    this.appliedItems = this.items

    for (const { name, value } of rawItems) {
      // 调用插件中定义的 API，并将返回值放到 items 数组中去
      this.add(name, isFunction(value) ? value(...args) : value)
    }
    // 调用完之后，重新将 items 指针指回原来的对象
    this.items = rawItems
  }
}

Option.prototype.apply = Option.prototype.syncApply
```

#### 5. ModuleResolver - `@vuepress/shared-utils/lib/moduleResolver.js`

这个主要看下 `resolve` 方法就可以了，略过

```js
function tryChain(resolvers, arg) {
  let response
  for (let resolver of resolvers) {
    if (!Array.isArray(resolver)) {
      resolver = [resolver, true]
    }
    const [provider, condition] = resolver
    if (!condition) {
      continue
    }
    try {
      response = provider(arg)
      return response
    } catch (e) {}
  }
}

class ModuleResolver {
  resolve(req) {
    const isStringRequest = isString(req)
    const resolved = tryChain(
      [
        /**
         * Resolve non-string package, return directly.
         */
        [this.resolveNonStringPackage.bind(this), !isStringRequest],
        /**
         * Resolve module with absolute/relative path.
         */
        [this.resolvePathPackage.bind(this), isStringRequest],
        /**
         * Resolve module from dependency.
         */
        [this.resolveDepPackage.bind(this), isStringRequest],
      ],
      req
    )
    return resolved
  }
}
```

#### 总结

下面就来回顾下插件被注册和使用的整个流程

- `App` 实例上有一个通过 `PlginAPI` 类构建的 `pluginAPI` 实例对象
- `pluginAPI` 实例上有一个 `_pluginResolver` 属性，它是通过 `ModuleResolver` 类的实例，主要利用实例上的 resolve 方法来查找插件模块，并完成标准化
- `pluginAPI` 实例上有一个 `options` 属性，用来存放不同类型的 `option` 实例, 如 `AsyncOption/EnhanceAppFilesOption/...`
  - 不同类型的 `Option` 构造器都是基于基类 `Option` 扩展的，他们之间主要是 `apply` 方法的不同，也就是插件被真正调用时所要用到的方法
  - 每个 `option` 实例上都有一个 `items` 属性，用来存放经过 `_pluginResolver.resolve` 方法标准化后的插件方法
- 在所有插件都经过处理完成之后，不同的 `API` （如：`ready`）， 会通过不同的 `key` 如：`ready`， 来获取 `pluginAPI.options` 对象中对应 `ready` 属性的值，并遍历其 `items` 属性, 循环调用里面定义的 `ready` 方法

到这里插件相关的原理就讲完了。

这东西说起来有点绕，可能表达不好，贴两张图就明白了：

1). 下图就是 `pluginAPI.options` 属性的内容：当调用 `await this.pluginAPI.applyAsyncOption('ready')` 时，就会走到这里。而`items` 存储了所有插件中定义的 `ready` 方法

<Shadow-Img :src="$withBase('/assets/vuepress/5.jpg')" />

2). 这张图就是最终的 `ready` 方法们被调用的地方了

<Shadow-Img :src="$withBase('/assets/vuepress/6.jpg')" />

ok，讲完这部分的原理，咱们回到一开始的问题：`前端路由是如何生成的？`

前面在 `App` 实例化的过程中，有一步生成 `page` 的部分没有说，放到这里来说正合适。

```js
  async resolvePages () {
    // ...
    const pageFiles = sort(await globby(patterns, { cwd: this.sourceDir }))
    await Promise.all(pageFiles.map(async (relative) => {
      const filePath = path.resolve(this.sourceDir, relative)
      await this.addPage({ filePath, relative })
    }))
  }
```

逻辑很简单，就是遍历文件目录，处理文件内容并生成 `page` 对象，然后添加到 `this.pages` 数组里就完了，贴两张图看下长啥样就可以了

- `pageFiles`

  <Shadow-Img :src="$withBase('/assets/vuepress/7.jpg')" />

- `this.pages`

  <Shadow-Img :src="$withBase('/assets/vuepress/8.jpg')" />

好了，这里 `this.pages` 里面有了内容，下面就可以看是如何生成前端路由的了。

**能有耐心看到这里的都是勇士，我都快写不下去了 😂😂😂**

6. 路由的生成

可以说 vuepress 中绝大部分功能都是通过插件来实现的，其中路由的生成就是一个内部插件，它的定义在：

`core/lib/internal-plugins/route.js`

```js
module.exports = (options, ctx) => ({
  name: '@vuepress/internal-routes',
  // @internal/routes
  async clientDynamicModules() {
    const code = importCode(ctx.globalLayout) + routesCode(ctx.pages)
    return { name: 'routes.js', content: code, dirname: 'internal' }
  },
})
```

可以看到，`route` 插件的内部实现，用到了 `clientDynamicModules` 这个 `Option API`。有关内部 `importCode` 以及 `routesCode` 的实现，大家可以去源码里翻一下，比较简单，主要就是通过字符串拼接的方式，生成能够被前端调用的一个模块，只不过是字符串的形式。

上面已经讲过了插件的注册以及调用过程，这里就看下当 `clientDynamicModules` 被调用时，最后返回的结果就好了。
下面的结果就是返回对象中的 `content` 属性的值，只不过代码中它只是一串字符串，写到文件系统里就成了一个可被 `client` 端调用的模块了

```js
import { injectComponentOption, ensureAsyncComponentsLoaded } from '@app/util'
import rootMixins from '@internal/root-mixins'
import GlobalLayout from '/Users/wangqiang/Personal/blog/node_modules/@vuepress/core/lib/client/components/GlobalLayout.vue'

injectComponentOption(GlobalLayout, 'mixins', rootMixins)
export const routes = [
  {
    name: 'v-2da0cf04',
    path: '/',
    component: GlobalLayout,
    beforeEnter: (to, from, next) => {
      ensureAsyncComponentsLoaded('Layout', 'v-2da0cf04').then(next)
    },
  },
  {
    path: '/index.html',
    redirect: '/',
  },
  {
    path: '*',
    component: GlobalLayout,
  },
]
```

这里只是返回了文件的字符串内容，而写入文件系统的操作是在调用这个插件之后，也就是在
`node/App.js` 的 `process` 方法的最后 `this.pluginAPI.applyAsyncOption('clientDynamicModules')` 这段代码的内部执行逻辑里

```js
class ClientDynamicModulesOption extends AsyncOption {
  async apply(ctx) {
    await super.asyncApply()

    for (const { value, name: pluginName } of this.appliedItems) {
      const { name, content, dirname = 'dynamic' } = value
      await ctx.writeTemp(
        `${dirname}/${name}`,
        `
/**
 * Generated by "${pluginName}"
 */
${content}\n\n
        `.trim()
      )
    }
  }
}
```

最终将路由文件写入到了用户的 `node_modules/@vuepress/core/.temp/internal` 目录下。到这里关于前端路由的生成就讲完了

### 问题二：`vue-router` 是如何接管前端路由的呢

`vuepress` 内部通过 `webpack` 构建的结果是为每个 `md` 文件生成一个 `html` 页面，这也是一开始为什么我会以为它是一个 `MPA` 应用的原因，思维有点固化了，毕竟我们常见的 `SPA` 应用，几乎都是只有一个 `index.html` 模板文件。那多个 `html` 页面怎么做 SPA 呢？

其实也很简单，跟 `SPA` 一个道理。

我们知道传统的 `SPA` 应用，服务端返回的模板文件中都会包含几个公共 `js` 文件，最常见的比如 `app.xxx.js`，既然都是公共的，那只要给每个产出的 `html` 文件内都注入进这些公共的 `js` 文件不就可以了吗？实际上，`vuepress` 也就是这样做的。

这样做的另外一个好处就是，不需要 `Github Pages` 服务来支持，就实现了 `SPA`。谁说 `SPA` 一定需要服务端支持的？打他！
相比于 [`spa-github-pages`](https://github.com/rafgraph/spa-github-pages#how-it-works) 提供的 `hack` 的方式实现 SPA，是不是就优雅了很多。

说了这么多，还是回归主题：**怎么去实现一个插件，可以做到针对私密路由的验证访问呢？**

其实原理也很简单。通过上面对 `vuepress` 插件从注册到调用的整个流程的分析，相信你也已经有了自己的思路。下面就说下我的实现：

#### 第一步：导航守卫

方案二一开始已经提到了，要针对路由做验证，那最好的地方肯定就是 `vue router` 的导航守卫，而 `vuepress` 的插件体系也恰好为我们提供了这样的一个契机，让我们可以在 `router` 上做文章。

这一步用到的 API 就是 `enhanceAppFiles`，在这个 API 里我们可以拿到 `router` 实例:

```js
export default ({
  Vue, // VuePress 正在使用的 Vue 构造函数
  options, // 附加到根实例的一些选项
  router, // 当前应用的路由实例
  siteData, // 站点元数据
  isServer, // 当前应用配置是处于 服务端渲染 或 客户端
}) => {
  // ...
}
```

<Shadow-Img :src="$withBase('/assets/vuepress/9.jpg')" wd="800"/>

说实话，一开始看到这个 `API` 完全不理解他是做什么的，看了官方提供的几个插件的实现才知道，原来它跟我们在项目里面定义的 `enhanceApp.js` 的功能是一样的，只不过我们在插件中定义的这个 `api` 会晚于用户的 `enhanceApp.js` 的执行。而且它也跟生成 `route` 文件的方式一样，会在 `node` 端被写入到文件系统中的 `@vuepress/core/.temp/app-enhancers` 目录下

#### 第二步：路由加密配置

想要实现路由拦截，前提得先知道哪些路由是需要通过验证才能访问的，那这里就会涉及到 `route` 生成的部分。与刚才不一样的是，`vuepress` 并没有提供给我们可以钩入 `route` 生成逻辑的钩子，但 `route` 的生成依赖通过对文件系统的遍历生成 `page` 实例的过程，而这个过程，是有 `API` 可以进行干预的，那就是 `extendPageData`

<Shadow-Img :src="$withBase('/assets/vuepress/10.jpg')"/>

所以我们只需要根据用户在 `Front Matter` 中的配置，在这里获取到之后给 page 实例扩展一个需要加密访问的 标记 就可以了

#### 第三步：验证页面的生成

需要验证访问的标记有了，下一步就是如何生成一个 `密码验证` 的页面，让那些需要验证的路由跳转到密码验证页上去。这一步的实现其实有很多种方案，一开始我想的是通过 `Vue.extend` 创建一个组件构造器的方式，就像我们常用的 `Modal` 弹层组件一样，在需要验证密码的时候弹出来，验证通过之后隐藏并跳转。这样做的一个好处就是，我可以直接使用 `SFC` 来定义这个组件，而且也不需要额外引入其他的东西，实现起来也简单。

但是这种方式也有一些弊端，比如：

1、用户如果想定制化自己的验证页面怎么办？
2、我懒得自己写样式，想用现成的组件库怎么办？
3、组件库的问题其实可以解决，但是 `vuepress` 本身是可以应用其他第三方的主题，如果第三方主题也引入了不同的组件库造成冲突怎么办？
4、这种方式实现，几乎所有的逻辑都放到 导航守卫 里面去做，耦合严重且不优雅

所以针对上面存在的几个问题，最终没有采用这种方式去做，而是采用了另外一种方式，让 导航守卫 还是专职自己的跳转工作，密码验证的逻辑单独抽离到一个脱离 `vuepress` 路由系统的 `html` 页面中来。这样的话，无论我是引用第三方组件库还是其他资源都可以做到很自由。

当然这种方式也不是没有问题，因为脱离了 `vuepress` 应用的路由系统，意味着我没有办法通过 `router` 编程式的导航做页面跳转，只能通过 `location.replace、location.href` 或者 `a` 标签的方式跳转页面，这样做就会导致页面的刷新，用户体验肯定不如使用 `router` 的方式好（不过实际体验下来，感觉也还可以）。

# 最后总结

终于写完了，如果有人能从头到尾一点点看到这里，那这个人一定不是我...如果是你的话，那我给你点赞，道一声：`お疲れさまでした`~

其实，`vuepress@2.x` 现在也已经在 `beta` 阶段了，现在写这些基于 `1.x` 的内容似乎有点 `out`，而且现在也已经有了通过 `vite + vue3` 的 `vitepress`。

怎么说呢？个人觉得，技术这种东西，学到了就是不亏。如果之前没有接触过 vuepress 那我建议，可以直接去玩 `vitepress`。

新技术的出现，多半是由于旧技术存在的缺陷和不足，或者是无法适应当前的大环境而催生出来的，所以了解技术历史其实也有利于我们去规避前辈们踩过的坑。

再者，技术中使用的各种编程思想常常是比技术本身更有意义。就比如说 1.x 版本中的插件系统的实现：主题即插件、配置文件也是插件、而且还可以在插件中使用插件，这种插件系统的架构和实现给整个应用带来了很强的灵活性和扩展性，这种思想就很值得去学习。

最后，如果觉得本文对你有帮助，烦请移步[github](https://github.com/alphawq/vuepress-plugin-posts-encrypt) 给个 `star`(卑微码农在线求 ⭐️)

如果觉得没有帮助的话，那一定是你没有好好看这篇文章，我写的东西怎么可能没有用？作为一名合格的码农，我写的代码怎么可能有 `Bug`？那是用户不会用！

哈哈，开个玩笑~

`ありがとう~`
