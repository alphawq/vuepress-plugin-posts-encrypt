module.exports = function genEnhanceAppFile(path, STORAGE_KEY) {
  return `export default ({ Vue, router, siteData, isServer }) => {
    // 获取所有需要加密的路由
    if(!isServer) {
      let getLocalStorageItem = function (key, subKey) {
        let item = localStorage.getItem(key)
        if(!item) return false
        try{
          let _item = JSON.parse(item)
          let sub = _item[subKey]
          //如果有startTime的值，说明设置了失效时间
          if(sub && sub.expires){
            let date = new Date().getTime()
            let value = sub.value
            // 过期了
            if(date - sub.startTime > sub.expires){
              delete _item[subKey]
              localStorage.setItem(key, JSON.stringify(_item))
              return false
            }
          }
          return sub.value
        } catch (error){
          return false
        }
      }
      const secretsRoutes = siteData.pages.filter(page => (page.frontmatter && page.frontmatter.secret ===  true))
      // 存储已经解密过的文章路由
      router.beforeEach((to, from, next) => {
        let name = to.name
        let path = to.path
        if(secretsRoutes.find(route => route.key === name)) {
          if(getLocalStorageItem('${STORAGE_KEY}', name)) return next()
          let ele = document.createElement('a')
          // 需要将path替换成用户配置的内容
          ele.href = '${path}?redirect=' + encodeURIComponent(name) + '&path=' + encodeURIComponent(path)
          ele.click() 
        } else {
          next()
        }
      })
    }
  }`
}
