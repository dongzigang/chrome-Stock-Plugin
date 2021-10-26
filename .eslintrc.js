module.exports = {
  root: false,
  globals: {
    chrome: false,
  },
  env: {
    node: false
  },
  extends: [
    'plugin:vue/vue3-essential',
    '@vue/standard'
  ],
  parserOptions: {
    parser: 'babel-eslint'
  },
  rules: {
    "generator-star-spacing": "off",
    "object-curly-spacing": "off",
    "no-var": "error",
    "semi": 0,
    "eol-last": "off",
    "no-tabs": "off",
    "indent": "off",
    "quote-props": 0,
    "no-mixed-spaces-and-tabs": "off",
    "no-trailing-spaces": "off",
    "arrow-parens": 0,
    "spaced-comment": "off",
    "space-before-function-paren": "off",
    "no-empty": "off",
    "no-else-return": "off",
    "no-unused-vars": [0, {"vars": "all", "args": "after-used"}],
    "no-console": "off",
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off'
  }
}
