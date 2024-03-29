/*
 * @Author: Aphasia alphawq@foxmail.com
 * @Date: 2022-02-28 20:53:33
 * @LastEditors: Aphasia alphawq@foxmail.com
 * @LastEditTime: 2022-12-01 04:09:10
 * @FilePath: /vuepress-plugin-posts-encrypt/packages/blog/docs/.vuepress/config.js
 * @Description: 示例
 *
 * Copyright (c) 2022 by Aphasia alphawq@foxmail.com, All Rights Reserved.
 */
const sidebar = require('./configs/index')

module.exports = {
  theme: 'reco',
  title: 'A Blog Demo',
  description: '一个用来测试vuepress plugin的样例博客',
  base: '/',
  dest: './dist',
  head: [['link', { rel: 'icon', href: '/assets/logo.png' }]],
  extraWatchFiles: ['.vuepress/config.js', '.vuepress/configs/*.js'],
  markdown: {
    lineNumbers: false,
    anchor: { permalink: true },
    toc: { includeLevel: [1, 2] }
  },
  plugins: [
    [
      'posts-encrypt',
      {
        route: '/auth',
        passwd: 12345,
        encryptInDev: true,
        expires: 1000 * 600,
        checkAll: true
      }
    ],
    [
      '@vuepress/medium-zoom',
      {
        selector: '.page :not(a) > img',
        // See: https://github.com/francoischalifour/medium-zoom#options
        options: {
          margin: 16
        }
      }
    ]
  ],
  themeConfig: {
    startYear: new Date().getFullYear(),
    author: 'Alphawq',
    authorAvatar: '/assets/avatar.png',
    smoothScroll: true,
    nav: require('./configs/nav'),
    sidebar: sidebar,
    lastUpdated: 'Last Updated',
    repo: 'https://github.com/alphawq/vuepress-plugin-posts-encrypt.git',
    editLinks: false,
    noFoundPageByTencent: false,
    type: 'blog',
    // 博客配置
    blogConfig: {
      category: {
        location: 2, // 在导航栏菜单中所占的位置，默认2
        text: 'Category' // 默认文案 “分类”
      },
      tag: {
        location: 3, // 在导航栏菜单中所占的位置，默认3
        text: 'Tag' // 默认文案 “标签”
      }
    }
  },
  chainWebpack: (config, isServer) => {}
}
