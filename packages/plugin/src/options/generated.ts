import { Options, Context } from '../index'

import { path } from '@vuepress/shared-utils'
import { removedir } from '../utils'

export default (options: Options, ctx: Context, genCiphertext, route: string) => {
  return async (pagePaths: string[]): Promise<void> => {
    const _route: string = /\.html$/.test(route) ? route : `${route}.html`
    const genPath = path.join(ctx.outDir, _route)
    genCiphertext()(genPath, void 0, removedir)
  }
}
