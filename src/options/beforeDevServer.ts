import Vuepress from 'vuepress-types'
import { Application } from 'express'
import WebpackDevServer from 'webpack-dev-server'
import { Options } from '../index'
import fs from 'fs'
import path from 'path'

/**
 * 用于在 开发模式 下预览加密效果
 * */ 
export default (options: Options, ctx: Vuepress.Context, genCiphertext: Function) => {
  
  let { route } = options
  let { tempPath } = ctx
  const genPath = path.join(ctx.tempPath, `${require('../../package.json').name}${route}.html`)

  return async (app: Application, server: WebpackDevServer) => {

    const serverRoute = path.join(ctx.base, route as string)

    genCiphertext()(genPath)

    app.get(serverRoute as string, function(req, res) {
      fs.createReadStream(genPath).pipe(res)
    });
  }
}


