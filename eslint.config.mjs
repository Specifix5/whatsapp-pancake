// @ts-check

import tseslint from 'typescript-eslint';
import stylisticTs from '@stylistic/eslint-plugin-ts';
import parserTs from '@typescript-eslint/parser';
import globals from "globals";

export default tseslint.config(
  {
    // config with just ignores is the replacement for `.eslintignore`
    ignores: ['**/build/**', '**/dist/**'],
  },
  ...tseslint.configs.recommended,
  {
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      '@stylistic/ts': stylisticTs
    },
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: parserTs,
      globals: {
        ...globals.node
      }
    },
    rules: {
      '@stylistic/ts/semi': ['error', 'always'],
      '@stylistic/ts/indent': ['error', 2],
      '@typescript-eslint/no-unused-vars': ['error', {
        "args": "all",
        "argsIgnorePattern": "^_",
        "caughtErrors": "all",
        "caughtErrorsIgnorePattern": "^_",
        "destructuredArrayIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "ignoreRestSiblings": true
      }],
      '@typescript-eslint/no-explicit-any': 'off'
    },
  },
  {
    // disable type-aware linting on JS files
    files: ['**/*.js'],
    ...tseslint.configs.disableTypeChecked,
  },
);