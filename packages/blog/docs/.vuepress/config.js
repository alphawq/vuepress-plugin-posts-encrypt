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
        passwd: '1234',
        encryptInDev: true,
        expires: 1000 * 60
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
