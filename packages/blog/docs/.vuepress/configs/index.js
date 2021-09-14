const { readdirSync, statSync } = require('fs')
const { join, resolve, basename, extname } = require('path')
const BASEPATH = resolve(__dirname, '../../../docs')
const BASENAME = 'README'
const EXTNAME = '.md'

function genConfig() {
  const files = readdirSync(BASEPATH)
  const sidebar = {}
  walk(files, sidebar)
  // 确保根路由的sidebar在最后定义，参见[https://v1.vuepress.vuejs.org/zh/theme/default-theme-config.html#%E5%A4%9A%E4%B8%AA%E4%BE%A7%E8%BE%B9%E6%A0%8F]
  let res = Object.create(null)
  Object.keys(sidebar)
    .reverse()
    .forEach(key => {
      res[key] = sidebar[key].sort()
    })
  // home页不需要sidebar
  delete res['/']
  return res
}

function walk(dir = [], sidebar, parentPath = '/') {
  if (!dir.length) return
  let docs = dir.filter(file => !file.startsWith('.'))
  for (let file of docs) {
    let _path = join(BASEPATH, `${parentPath}${file}`)
    let stat = statSync(_path)
    let extName = extname(_path)
    let name = basename(_path, extName)
    // 是文件且以 .md 结尾
    if (stat.isFile() && extName === EXTNAME) {
      // 如果不是 README.md 文件
      if (name !== BASENAME) {
        sidebar[parentPath] ? sidebar[parentPath].push(name) : (sidebar[parentPath] = [name])
      } else {
        sidebar[parentPath] ? sidebar[parentPath].push('') : (sidebar[parentPath] = [''])
      }
    }

    if (stat.isDirectory()) {
      let dirs = readdirSync(_path)
      walk(dirs, sidebar, `${parentPath}${name}/`)
    }
  }
}

module.exports = genConfig()
