import Vuepress from 'vuepress-types'
import { Options, TypedMap, InjectConfig } from '../index'

import generated from './generated'
import enhanceAppFiles from './enhanceAppFiles'
import extendPageData from './extendPageData'
import beforeDevServer from './beforeDevServer'
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
  warn,
  info,
  TMPL_PATH,
  LESS_PATH
} from '../utils'
import { execSync } from 'child_process'

const pkg = require('../../package.json')

export default (options: Options, ctx: Vuepress.Context): Vuepress.PluginOptionAPI => {

  try {
    execSync(`mkdir -p ${ctx.tempPath}/${pkg.name}`)
  } catch(e) {
    console.log(e)
  }

  let _options = mergeOptions(void 0, options)
  info(_options)

  const { isProd, tempPath, base } = ctx
  const encryptedPathMap: TypedMap = new Map()
  const { route, encryptInDev, expires, template, injectConfig } = _options
  const isCustom = (template && (template !== TMPL_PATH)) as boolean
  const {
    less,
    iview,
    animate
  } = <InjectConfig>injectConfig

  if(!isProd && !encryptInDev) return {
    ready() {
      info('@vuepress/plugin-posts-encrypt is disabled')
    },
    updated() {
      info('@vuepress/plugin-posts-encrypt is updated')
    }
  }

  const genCiphertext = () => {
    const size = encryptedPathMap.size
    const text = [...encryptedPathMap.entries()].reduce((pre, cur, index) => {
      const [k, v] = cur
      return `${pre}${k}_${v}${index == size - 1 ? '' : ';'}`
    }, '')

    return (genPath, options) => {
      try{
        const jsContent = genInjectedJS(text, base, isCustom, expires)
        const uglifiedJS = uglify(jsContent, Object.assign({ 
          mangle: {
            toplevel: true,
            reserved: ['Vue', '']
          },
          output: {
            comments: false
          }
        }, options) )
        // 注入css
        let minifyedCSS = genInjectedCSS(isCustom ? less : LESS_PATH, tempPath)
        
        genFile(template as string, genPath, {
          animate_css_tag: !isCustom || animate === true ? ANIMATECSS_TAG : '',
          iview_css_tag: !isCustom || iview === true ? IVIEW_CSS_TAG : '',
          iview_js_tag: !isCustom || iview === true ? IVIEW_JS_TAG : '',
          validate_js_tag: `<script>${isCustom ? jsContent : uglifiedJS.code}</script>`,
          minified_css_tag: minifyedCSS.styles ? `<style type="text/css">${minifyedCSS.styles}</style>` : ''
        })
      } catch(e) {
        console.log(e)
        error(e + '')
      }
    }
  }

  return {
    // 给用户自定义验证模板的时候使用
    clientDynamicModules() {
      return {
        name: 'decrypt.js',
        content: `
          import cryptoJS from 'crypto-js'
          export function decrypt (passphrase, encryptedMsg) {
            if(!encryptedMsg) return false
            const encryptedHMAC = encryptedMsg.substring(0, 64)
            const encryptedCtn = encryptedMsg.substring(64)
            const decryptedHMAC = cryptoJS.HmacSHA256(
              encryptedCtn,
              cryptoJS.SHA256(passphrase).toString()
            ).toString()

            if (decryptedHMAC !== encryptedHMAC) {
              return false
            }
            return true 
          }
          `
      }
    },
    beforeDevServer: beforeDevServer(options, ctx, genCiphertext),
    // 用户自定义的 enhanceAppFiles.js 会先于此方法被调用
    enhanceAppFiles: enhanceAppFiles(options, ctx),
    // 记录需要加密的路由
    extendPageData: extendPageData(options, ctx, encryptedPathMap), 
    // 用于构建的时候将验证模板写入到用户的dist目录下
    generated: generated(options, ctx, genCiphertext, route as string)
  }
}
