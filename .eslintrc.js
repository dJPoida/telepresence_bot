module.exports = {
  extends: [
    'airbnb',
    'plugin:@typescript-eslint/recommended',
    'plugin:node/recommended',
    'prettier/@typescript-eslint',
  ],
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
    'node',
    'prettier',
  ],
  env: {
    browser: true,
    node: true,
  },
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
    'import/resolver': {
      typescript: {},
    },
  },
  parserOptions: {
    sourceType: 'module',
  },
  rules: {
    'class-methods-use-this': 'off',
    '@typescript-eslint/no-empty-interface': 'off',
    '@typescript-eslint/interface-name-prefix': 'off',
    'max-classes-per-file': 'off',
    '@typescript-eslint/class-name-casing': 'off',
    'lines-between-class-members': 'off',
    camelcase: 'off',
    'brace-style': 'off',
    // 'no-nested-ternary': 0,
    'no-restricted-syntax': 'off',
    'no-useless-constructor': 'off',
    'no-nested-ternary': 'off',
    'linebreak-style': 'off',
    'react/prop-types': 'off',
    'prefer-arrow-callback': 'off',
    'object-curly-newline': 'off',
    'max-len': ['error', { code: 180, ignoreComments: true }],
    'no-underscore-dangle': 'off',
    'no-await-in-loop': 'off',
    'react/jsx-props-no-spreading': 'off',
    'react/jsx-filename-extension': [2, { extensions: ['.js', '.jsx', '.ts', '.tsx'] }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/ban-ts-ignore': 'off',
    '@typescript-eslint/no-this-alias': 'off',
    '@typescript-eslint/camelcase': 'off',
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'never',
        jsx: 'never',
        ts: 'never',
        tsx: 'never',
      },
    ],
    'import/no-extraneous-dependencies': [2, { devDependencies: ['**/test.tsx', '**/test.ts'] }],
    'import/prefer-default-export': 'off',
    'node/no-unsupported-features/es-syntax': [
      'error',
      {
        ignores: ['modules'],
      },
    ],
    'node/no-missing-import': ['error', {
      allowModules: [],
      tryExtensions: ['.ts', '.js', '.d.ts', '.tsx'],
    }],

  },
};
