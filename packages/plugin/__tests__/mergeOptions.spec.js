/*
 * @Author: Aphasia alphawq@foxmail.com
 * @Date: 2022-02-28 20:53:33
 * @LastEditors: Aphasia alphawq@foxmail.com
 * @LastEditTime: 2022-12-01 04:33:41
 * @FilePath: /vuepress-plugin-posts-encrypt/packages/plugin/__tests__/mergeOptions.spec.js
 * @Description: 单元测试
 *
 * Copyright (c) 2022 by Aphasia alphawq@foxmail.com, All Rights Reserved.
 */
import { mergeOptions, DefaultOptions, TMPL_PATH } from '@plugin/src/utils/index'
describe('Options Merge', () => {
  const expected = {
    route: '/validate',
    passwd: 1234,
    template: TMPL_PATH,
    encryptInDev: true,
    expires: 1000 * 6,
    checkAll: false,
    injectConfig: {
      less: '',
      iview: false,
      animate: false
    }
  }
  test('Undefined property should merged to default', () => {
    const options = {
      route: '/validate',
      passwd: 1234,
      encryptInDev: true,
      expires: 1000 * 6
    }

    expect(mergeOptions(DefaultOptions, options)).toEqual(expected)
  })

  test('Extra attributes should be deleted', () => {
    const options = {
      route: '/validate',
      passwd: 1234,
      encryptInDev: true,
      expires: 1000 * 6,
      test1: 'test1',
      props: {
        name: 'name'
      }
    }

    expect(mergeOptions(DefaultOptions, options)).toEqual(expected)
  })
})
