// @types
import Vuepress from 'vuepress-types'
// @dependencies
import optionsGen from './options'

export interface InjectConfig {
  // 自定义模板外联的less文件地址
  less?: string
  // 是否注入IView组件库，默认 false
  iview?: boolean
  // 是否注入anmitecss动画库，默认 false
  animate?: boolean
}

export interface Options {
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

export type TypedMap<T = string, U = string> = Map<T, U>
interface _Context {
  __tempdir__?: string
}

export type Context = _Context & Vuepress.Context

module.exports = (options: Options, ctx: Vuepress.Context): Vuepress.PluginOptionAPI => ({
  name: '@vuepress/plugin-posts-encrypt',
  ...optionsGen(options, ctx)
})
