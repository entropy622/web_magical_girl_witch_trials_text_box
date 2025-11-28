import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import prettierPlugin from 'eslint-plugin-prettier'
import prettierConfig from 'eslint-config-prettier'

// 👇 1. 引入插件
import unusedImports from 'eslint-plugin-unused-imports'

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      prettierConfig,
    ],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'prettier': prettierPlugin,
      // 👇 2. 注册插件
      'unused-imports': unusedImports,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'prettier/prettier': 'error',

      // 👇 3. 关键配置开始 ==============================

      // 必须关闭 TS 的默认规则，否则会和插件冲突，且 TS 默认规则不支持自动删除
      '@typescript-eslint/no-unused-vars': 'off',

      // 自动删除未使用的 import
      'unused-imports/no-unused-imports': 'error',

      // 自动删除未使用的变量
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_', // 忽略 _ 开头的变量
          args: 'after-used',
          argsIgnorePattern: '^_', // 忽略 _ 开头的参数
        },
      ],
      // 关键配置结束 ====================================
    },
  },
)