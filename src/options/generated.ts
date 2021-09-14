import { Options, Context } from '../index'

import { path } from '@vuepress/shared-utils'
import { removedir } from '../utils'

export default (options: Options, ctx: Context, genCiphertext, route: string) => {
  removedir(ctx.__tempdir__)

  return async (pagePaths: string[]): Promise<void> => {
    const genPath = path.join(ctx.outDir, `${route}.html`)
    genCiphertext()(genPath)
  }
}
