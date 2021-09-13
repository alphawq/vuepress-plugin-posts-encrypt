import { Application } from 'express'
import WebpackDevServer from 'webpack-dev-server'
import { Options, Context } from '../index'

import fs from 'fs'
import path from 'path'

/**
 * 用于在 开发模式 下预览加密效果
 * */ 
export default (options: Options, ctx: Context, genCiphertext: Function) => {
  
  const { route } = options
  const genPath = path.join(ctx.__tempdir__ || ctx.tempPath, `${route}.html`)

  return async (app: Application, server: WebpackDevServer) => {

    const serverRoute = path.join(ctx.base, route as string)

    genCiphertext()(genPath)

    app.get(serverRoute as string, function(req, res) {
      if(!fs.existsSync(genPath)) {
        genCiphertext()(genPath)
      }
      fs.createReadStream(genPath).pipe(res)
    });
  }
}


