/*
 * @Author: Aphasia alphawq@foxmail.com
 * @Date: 2022-02-28 20:53:33
 * @LastEditors: Aphasia alphawq@foxmail.com
 * @LastEditTime: 2022-12-01 03:47:10
 * @FilePath: /vuepress-plugin-posts-encrypt/packages/plugin/src/options/extendPageData.ts
 * @Description: 统计所有需要验证的路由
 *
 * Copyright (c) 2022 by Aphasia alphawq@foxmail.com, All Rights Reserved.
 */
import Vuepress from 'vuepress-types'
import { Options, TypedMap, Context } from '../index'

import { encrypt } from '../utils/encrypt'
import { CHECK_ALL_PATH_KEY } from '../utils'

export default (options: Options, ctx: Context, encryptedPaths: TypedMap) => {
  const { passwd: BasePasswd, checkAll = false } = options

  // 要想校验所有路由，只能使用全局密码配置
  if (checkAll === true) {
    const ciphertext = encrypt(CHECK_ALL_PATH_KEY, BasePasswd)
    encryptedPaths.set(CHECK_ALL_PATH_KEY, ciphertext)
  }

  return ($page: Vuepress.Page) => {
    const { frontmatter, key } = $page
    const { secret, passwd } = frontmatter
    // 防止密码暴露
    delete $page.frontmatter.passwd
    // 全部验证
    if (checkAll === true) {
      $page.frontmatter.secret = true
      $page.frontmatter[CHECK_ALL_PATH_KEY] = checkAll
      return
    }

    if (secret === true) {
      const ciphertext = encrypt(key, passwd || BasePasswd)
      encryptedPaths.set(key, ciphertext)
    }
  }
}
