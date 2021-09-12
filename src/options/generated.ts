import Vuepress from 'vuepress-types'
import { Options } from '../index'

import { path }  from '@vuepress/shared-utils'

export default (options: Options, ctx: Vuepress.Context, genCiphertext: Function, route: string) => 
  async (pagePaths: string[]): Promise<void> => {
    const genPath = path.join(ctx.outDir, `${route}.html`)
    genCiphertext()(genPath)
  }