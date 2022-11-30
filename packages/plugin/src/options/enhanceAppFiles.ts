/*
 * @Author: Aphasia alphawq@foxmail.com
 * @Date: 2022-02-28 21:02:16
 * @LastEditors: Aphasia alphawq@foxmail.com
 * @LastEditTime: 2022-12-01 03:56:59
 * @FilePath: /vuepress-plugin-posts-encrypt/packages/plugin/src/options/enhanceAppFiles.ts
 * @Description: 产出 enhanceAppFiles.js 文件内容
 *
 * Copyright (c) 2022 by Aphasia alphawq@foxmail.com, All Rights Reserved.
 */
import { Options, Context } from '../index'

import genEnhanceAppFile from '../../assets/enhanceAppFiles'
import { STORAGE_KEY, CHECK_ALL_PATH_KEY } from '../utils'

export default (options: Options, ctx: Context) => () => {
  const { route } = options
  const { base } = ctx

  return {
    name: 'posts-encrypt-plugin',
    content: genEnhanceAppFile(base.replace(/\/$/, '') + route, STORAGE_KEY, CHECK_ALL_PATH_KEY)
  }
}
