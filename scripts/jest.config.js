const path = require('path')

module.exports = {
  rootDir: path.resolve(__dirname, '..'),
  moduleFileExtensions: ['js', 'ts'],
  testRegex: '(/__test__/.*|(\\.|/)(test|spec))\\.(ts|js)?$',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@plugin/(.*)$': '<rootDir>/packages/plugin/$1'
  },
  transform: {
    '^.+\\.js$': '<rootDir>/node_modules/babel-jest',
    '^.+\\.ts?$': '<rootDir>/node_modules/ts-jest'
  }
}
