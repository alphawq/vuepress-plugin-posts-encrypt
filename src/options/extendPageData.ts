import Vuepress from 'vuepress-types'
import { Options, TypedMap } from '../index'

import { encrypt } from '../utils/encrypt'

export default (options: Options, ctx: Vuepress.Context, encryptedPaths: TypedMap) => {
  
  const { passwd: BasePasswd } = options

  return ($page: Vuepress.Page) => {
    const { frontmatter, key } = $page
    const { secret, passwd } = frontmatter
    if(secret === true) {
      const ciphertext = encrypt(key, passwd || BasePasswd)
      encryptedPaths.set(key, ciphertext)
    }
  }
}