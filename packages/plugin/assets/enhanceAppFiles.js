/*
 * @Author: Aphasia alphawq@foxmail.com
 * @Date: 2022-02-28 20:53:33
 * @LastEditors: Aphasia alphawq@foxmail.com
 * @LastEditTime: 2022-12-01 03:55:39
 * @FilePath: /vuepress-plugin-posts-encrypt/packages/plugin/assets/enhanceAppFiles.js
 * @Description: 前端路由守卫相关逻辑
 *
 * Copyright (c) 2022 by Aphasia alphawq@foxmail.com, All Rights Reserved.
 */
module.exports = function genEnhanceAppFile(path, STORAGE_KEY, CHECK_ALL_PATH_KEY) {
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
        const secretsRoute = secretsRoutes.find(route => route.key === name);
        if(secretsRoute) {
          const checkAll = secretsRoute.frontmatter['${CHECK_ALL_PATH_KEY}'] === true;
          if(getLocalStorageItem('${STORAGE_KEY}', checkAll ?  '${CHECK_ALL_PATH_KEY}' : name)) return next()
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
