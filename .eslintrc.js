module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: ['plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  plugins: ['@typescript-eslint'],
  rules: {
    // 允许方法不设置参数类型以及返回值类型
    '@typescript-eslint/explicit-module-boundary-types': 0,
    allowArgumentsExplicitlyTypedAsAny: 0,
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['off']
  }
}
