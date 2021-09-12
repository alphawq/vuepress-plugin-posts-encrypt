import Vuepress from 'vuepress-types'
import { Options } from '../index'

import { path }  from '@vuepress/shared-utils'
import genEnhanceAppFile from '../../assets/enhanceAppFiles'
import { STORAGE_KEY } from '../utils'

export default (options: Options, ctx: Vuepress.Context) => () => {
  const { route } = options
  const { base } = ctx

  return {
    name: 'posts-encrypt-plugin',
    content: genEnhanceAppFile(path.join(base, <string>route), STORAGE_KEY)
  }
}