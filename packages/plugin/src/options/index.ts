import Vuepress from 'vuepress-types'
import { Options, TypedMap, InjectConfig, Context } from '../index'

import path from 'path'

import generated from './generated'
import extendPageData from './extendPageData'
import enhanceAppFiles from './enhanceAppFiles'
import beforeDevServer from './beforeDevServer'
import clientDynamicModules from './clientDynamicModules'
import {
  mergeOptions,
  genFile,
  uglify,
  genInjectedJS,
  genInjectedCSS,
  IVIEW_CSS_TAG,
  ANIMATECSS_TAG,
  IVIEW_JS_TAG,
  error,
  info,
  TMPL_PATH,
  LESS_PATH,
  mkdir
} from '../utils'

export default (options: Options, ctx: Context): Vuepress.PluginOptionAPI => {
  const _options = mergeOptions(void 0, options)
  const { isProd, base } = ctx
  const encryptedPathMap: TypedMap = new Map()
  const { route, encryptInDev, expires, template, injectConfig } = _options
  const isCustom = (template && template !== TMPL_PATH) as boolean
  const { less, iview, animate } = <InjectConfig>injectConfig
  const tempdir = (ctx.__tempdir__ = path.resolve(__dirname, '../../.temp/'))

  if (!isProd && !encryptInDev)
    return {
      ready() {
        info('Plugin Inactive: \n' + JSON.stringify(_options, null, 4))
      }
    }

  // 创建临时文件夹
  mkdir(tempdir)

  const genCiphertext = () => {
    const size = encryptedPathMap.size
    const text = [...encryptedPathMap.entries()].reduce((pre, cur, index) => {
      const [k, v] = cur
      return `${pre}${k}_${v}${index == size - 1 ? '' : ';'}`
    }, '')

    return (genPath, options, cb) => {
      try {
        const jsContent = genInjectedJS(text, base, isCustom, expires)
        const uglifiedJS = uglify(
          jsContent,
          Object.assign(
            {
              mangle: {
                toplevel: true,
                reserved: ['Vue']
              },
              output: {
                comments: false
              }
            },
            options
          )
        )

        // 注入css
        const minifyedCSS = genInjectedCSS(isCustom ? less : LESS_PATH, tempdir)

        genFile(template as string, genPath, {
          animate_css_tag: !isCustom || animate === true ? ANIMATECSS_TAG : '',
          iview_css_tag: !isCustom || iview === true ? IVIEW_CSS_TAG : '',
          iview_js_tag: !isCustom || iview === true ? IVIEW_JS_TAG : '',
          validate_js_tag: `<script>${isCustom ? jsContent : uglifiedJS.code}</script>`,
          minified_css_tag: minifyedCSS.styles ? `<style type="text/css">${minifyedCSS.styles}</style>` : ''
        })

        cb && cb(tempdir)
      } catch (e) {
        error(e + '')
        console.log(e)
      }
    }
  }

  return {
    // 提供给 client 的模块
    clientDynamicModules: clientDynamicModules(),
    // 开发模式下提供验证页的静态serve
    beforeDevServer: beforeDevServer(options, ctx, genCiphertext),
    // 用户自定义的 enhanceAppFiles.js 会先于此方法被调用
    enhanceAppFiles: enhanceAppFiles(options, ctx),
    // 记录需要加密的路由
    extendPageData: extendPageData(options, ctx, encryptedPathMap),
    // 用于构建的时候将验证模板写入到用户的 out 目录下
    generated: generated(options, ctx, genCiphertext, route as string)
  }
}
