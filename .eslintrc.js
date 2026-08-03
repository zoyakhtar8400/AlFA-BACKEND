module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
    node: true,
    jquery: true,
  },
  extends: ['airbnb-base', 'prettier', 'plugin:node/recommended'],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  overrides: [
    {
      env: {
        node: true,
      },
      files: ['.eslintrc.{js,cjs}'],
      parserOptions: {
        sourceType: 'script',
      },
    },
  ],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  plugins: ['prettier'],
  rules: {
    'no-console': 'off',
    'prettier/prettier': [
      'error',
      {
        endOfLine: 'auto',
      },
    ],
    'node/no-unpublished-require': [
      'error',
      {
        allowModules: ['electron'],
      },
    ],
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    // 'no-console': 'off',
    // 'func-names': 'off',
    // 'no-plusplus': 'off',
    // 'no-process-exit': 'off',
    // 'class-methods-use-this': 'off',
    'no-underscore-dangle': 'off',
  },
  settings: {
    'import/core-modules': ['electron'],
  },
};
