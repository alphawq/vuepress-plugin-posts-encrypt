import { cpus } from 'os'
import uglifyJS from 'uglify-js'
import CleanCSS from 'clean-css'
import { execSync } from 'child_process'
import { writeFileSync, readFileSync } from 'fs'
import { resolve as pathResolve, parse as pathParse, join as pathJoin } from 'path'
import { fs, toAbsolutePath, logger } from '@vuepress/shared-utils'

import { Options } from '../index'

import { CRYPTO_INJECT } from './encrypt'

const LIMIT = cpus().length - 1
const cleanCSS = new CleanCSS()

export const IVIEW_CSS_TAG = `<link rel="stylesheet" type="text/css" href="//unpkg.com/view-design@4.7.0/dist/styles/iview.css" />`
export const ANIMATECSS_TAG = `<link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css" />`
export const IVIEW_JS_TAG = `<script type="text/javascript" src="//unpkg.com/view-design@4.7.0/dist/iview.min.js"></script>`

export const STORAGE_KEY = '__vuepress_posts_encrypt_plugin__'
export const TMPL_PATH = pathResolve(__dirname, '../../assets/index.html')
export const LESS_PATH = pathResolve(__dirname, '../../assets/index.less')
export const isObject = (o): boolean => o && typeof o === 'object'
export const wrapperLogger = (prefix: string, type: string) => {
  return (...args) => (logger[type] ? logger[type](prefix, ...args) : logger.info(prefix, ...args))
}

export const error = wrapperLogger(`ERR@vuepress-plugin-posts-encrypt`, 'error')
export const warn = wrapperLogger(`WARN@vuepress-plugin-posts-encrypt`, 'warn')
export const info = wrapperLogger(`INFO@vuepress-plugin-posts-encrypt`, 'info')

export const DefaultOptions: Options = {
  route: '/auth', // 默认的验证页路由，最终路由会拼接上用户的 base 配置
  passwd: 'hello world', // 默认密码
  template: TMPL_PATH, // 默认模板文件路径
  encryptInDev: false, // 开发模式下是否开启文章加密
  expires: 0, // 密码过期时间，默认永不过期
  // 自定义模板时，需要注入的外部资源配置
  injectConfig: {
    less: '',
    iview: false,
    animate: false
  }
}

/**
 * 合并配置
 *
 * @param {object} base
 * @param {object} options
 * */
export const mergeOptions = (base = DefaultOptions, options = {}): Options => {
  const $options = Object.create(null)
  Object.entries(base).reduce((pre, cur) => {
    const [key, value] = cur
    const user = options[key]
    typeof user !== 'undefined'
      ? isObject(user)
        ? (pre[key] = mergeOptions(value, options[key]))
        : (pre[key] = user)
      : (pre[key] = value)
    return pre
  }, $options)

  return $options
}

/**
 * 生成注入的脚本
 *
 * @export
 * @param {string} text
 * @param {string} base
 * @param {number} expires 过期时间，默认 0，不过期
 * @param {boolean} isCustom 是否是用户自定义模板
 * @returns {string}
 */
export const genInjectedJS = (text: string, base: string, isCustom: boolean, expires?: number) => {
  // 按照文档，base应该始终以 `/` 开头并以 `/` 结束，参见[https://vuepress.vuejs.org/zh/guide/assets.html#%E5%9F%BA%E7%A1%80%E8%B7%AF%E5%BE%84]
  const { dir, base: _base } = pathParse(base)
  base = _base ? `${dir}${_base}` : _base

  const part1 = `
      /**
       * @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
       * Part1：配置基础数据 & 方法
       * @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
       * */ 
      const keySize = 256
      const iterations = 1000
      const sleep = (time = 500) => new Promise((resolve) => setTimeout(resolve, time))
      const getQuery = (() => {
        const search = location.search
        const queries = !search ? {} : (search.slice(1).split('&').reduce((pre, cur) => {
          let [k, v] = cur.split('=')
          pre[k] = decodeURIComponent(v)
          return pre
        }, {}))
        return (key) => queries[key]
      })()
      const setStorageItem = (key, subKey, params) => {
        try {
          let storage = JSON.parse(localStorage.getItem(key)) || {}
          let sub = {
            value: '',
            expires: 0,
            startTime: new Date().getTime() //记录何时将值存入缓存，毫秒级
          }
          storage[subKey] = Object.assign(sub, params)
          localStorage.setItem(key, JSON.stringify(storage))
        } catch(e) {
          console.error(e)
        }
      }
      /**
       * 验证密码是否正确
       * 
       * @param {string} password 用户输入的密码
       * @return {boolean} true|false
       * */ 
      function validate(password) {
        const encryptedMsg = '${text}'
        const reg = new RegExp(\`\${getQuery('redirect')}_([^;]*)\`)
        const matched = encryptedMsg.match(reg)
        if(!matched) return false
        const ciphertext = matched[1]
        const encryptedHMAC = ciphertext.substring(0, 64)
        const encryptedHTML = ciphertext.substring(64)
        const decryptedHMAC = CryptoJS.HmacSHA256(encryptedHTML, CryptoJS.SHA256(password).toString()).toString();
      
        return decryptedHMAC === encryptedHMAC
      }`

  const part2 = `
      /**
       * @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
       * Part2：密码验证通过后，需要将已验证通过的路由写入到 localstorage，防止死循环
       * @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
       * */ 
      setStorageItem('${STORAGE_KEY}', getQuery('redirect'), {
        value: true,
        expires: ${typeof expires === 'number' ? expires : 0}
      })`

  const part3 = `
      /**
       * @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
       * Part3：密码验证通过后跳转到目标地址
       * @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
       * */ 
      location.replace('${base}' + \`\${getQuery('path')}\`)`

  return isCustom
    ? `${part1}\n${part2}\n${part3}`
    : `${part1}\n
    new Vue({
      el: '#app',
      data() { 
        return {
          btnLoading: false,
          lockClass: '',
          offListener: null,
          modal_loading: false,
          formInline: {
            password: ''
          },
          ruleInline: {
            password: [
              { validator: this.validatePass, trigger: 'blur' }
            ]
          }
        }
      },
      mounted() {
        this.offListener = this.bindListener('formRef', this.changeLockClass.bind(this, ''))
      },
      unmounted() {
        this.offListener()
      },
      methods: {
        toggleBool(key) {
          this[key] = !this[key]
        },
        bindListener(refKey, userCb) {
          let elm = this.$refs[refKey].$el || this.$refs[refKey]
          let listener = (e) => {
            userCb.call(this, e)
          }
          elm && elm.addEventListener("animationend", listener)
          return () => elm.removeEventListener('animationend', listener)
        },
        changeLockClass(classNames, el) {
          this.lockClass = classNames
        },
        validatePass(rule, value, callback) {
          let passphrase = value
          let isCorrect = validate(passphrase)

          if (!isCorrect) {
            return callback(new Error('Not Correct!'))
          }
          callback()
        },
        handleSubmit(name = 'formInline') {
          if(this.formInline.password === '') return
          this.toggleBool('btnLoading')
          this.$refs[name].validate(async (valid) => {
            await sleep()
            this.toggleBool('btnLoading')
            if (valid) {
              ${part2}\n
              this.changeLockClass('animate__animated animate__hinge')
              await sleep(1000)
              ${part3}\n
            } else {
              this.changeLockClass('animate__animated animate__headShake')
            }
          })
        }
      }
    })`
}

/**
 * 生成注入的css
 *
 * @export
 * @param {string} fromPath
 * @param {string} toPath 写到 tmp 下
 */
export const genInjectedCSS = (fromPath, outPath) => {
  if (!fromPath || typeof fromPath !== 'string') return ''
  try {
    const _from = toAbsolutePath(fromPath)
    const _out = toAbsolutePath(pathJoin(outPath, `index.css`))
    // 编译less
    execSync(`npx lessc ${_from} ${_out}`)
    // 压缩
    return minifyCss(readFileSync(_out))
  } catch (e) {
    error(e)
    return ''
  }
}

/**
 * 异步并发限制
 *
 * @export
 * @param {Map<any, any>} sources
 * @param {*} callback
 * @param {*} [limit=LIMIT]
 * @returns
 */
export async function limitAsyncConcurrency(sources: Map<unknown, unknown>, callback, limit = LIMIT) {
  let done
  let runningCount = 0
  const lock: Array<(v?: unknown) => void> = []
  let total = sources.size
  if (!total) return

  const p = new Promise(resolve => (done = resolve))

  const block = async () => {
    return new Promise(resolve => lock.push(resolve))
  }

  const next = () => {
    const fn = lock.shift()
    fn && fn()
    runningCount--
  }

  const getFileContent = async (item): Promise<void> => {
    if (runningCount >= limit) await block()
    runningCount++

    new Promise((resolve, reject) => callback(resolve, reject, next, item)).then(res => {
      total--
      if (!total) {
        done()
      }
    })
  }

  for (const item of sources.entries()) {
    getFileContent(item)
  }

  return p
}

/**
 * 用于替换模板字符串中的占位符
 *
 * @export
 * @param {*} tpl
 * @param {*} data
 * @returns
 */
export function render(tpl, data) {
  return tpl.replace(/<%(.*?)%>/g, function (_, key) {
    return (data && data[key]) || ''
  })
}

export interface ReplaceData {
  [k: string]: string
}

/**
 * 用于 build 构建时，向 outPath 路径下写入 tmplPath 文件内容
 * 并替换模板内的占位符，注入变量值
 *
 * @export
 * @param {string} tmplPath
 * @param {string} outPath
 * @returns
 */
export function genFile(tmplPath: string, outPath: string, data: ReplaceData) {
  // 模板文件内容缓存
  let templateContents: string | null = null
  try {
    templateContents = readFileSync(tmplPath, 'utf8')
  } catch (e) {
    console.log(e)
    error('Failure: failed to read template: ' + tmplPath)
  }

  const renderedTemplate = render(
    templateContents,
    Object.assign(data, {
      crypto_inject_tag: CRYPTO_INJECT
    })
  )

  try {
    writeFileSync(outPath, renderedTemplate)
  } catch (e) {
    console.log(e)
    error('Failure: could not write template:' + outPath)
  }
  templateContents = null
}

/**
 * 压缩JS
 *
 * @export
 * @param {*} content
 * @param {*} options
 * @returns
 */
export function uglify(content, options) {
  return uglifyJS.minify(content, options)
}

/**
 * 压缩CSS
 *
 * @export
 * @param {*} content
 * @returns
 */
export function minifyCss(content) {
  return cleanCSS.minify(content)
}

export function mkdir(_path) {
  try {
    fs.ensureDirSync(_path)
  } catch (e) {
    console.log(e)
    error('Failure: failed to mkdir: ' + _path)
  }
}

/**
 * 删除文件夹及文件
 *
 * @param {*} _path
 */
export function removedir(_path) {
  try {
    fs.removeSync(_path)
  } catch (e) {
    console.log(e)
    error('Failure: failed to removedir: ' + _path)
  }
}
