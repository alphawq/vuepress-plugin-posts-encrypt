import { mergeOptions, DefaultOptions, TMPL_PATH } from '@plugin/src/utils/index'
describe('Options Merge', () => {
  const expected = {
    route: '/validate',
    passwd: 1234,
    template: TMPL_PATH,
    encryptInDev: true,
    expires: 1000 * 6,
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
