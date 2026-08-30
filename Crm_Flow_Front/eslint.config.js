import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

import shared from './eslint.rules.js';
import project from './tooling/eslint/index.js';

export default defineConfig([
  globalIgnores(['dist', 'dist-e2e', 'playwright-report', 'test-results']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      'react-refresh/only-export-components': ['error', { allowConstantExport: true }],
      'no-restricted-globals': [
        'error',
        { name: 'confirm', message: 'Use ConfirmationDialog para confirmações.' },
        { name: 'alert', message: 'Use feedback na interface ou um modal personalizado.' },
        { name: 'prompt', message: 'Use um formulário ou modal personalizado.' },
      ],
      'no-restricted-properties': [
        'error',
        ...['window', 'globalThis'].flatMap((object) =>
          ['confirm', 'alert', 'prompt'].map((property) => ({
            object,
            property,
            message: 'Use os componentes de feedback e confirmação do projeto.',
          })),
        ),
      ],
    },
  },
  {
    files: ['src/components/ui/**/*.{js,jsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: ['src/**/*.jsx'],
    ignores: ['src/components/ui/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'JSXOpeningElement[name.name="form"]',
          message: 'Use Form de @/components/ui/form para preservar o foco e os atalhos de envio.',
        },
        {
          selector: 'JSXOpeningElement[name.name=/^(input|select|textarea)$/]',
          message:
            'Use Input, Textarea, NativeSelect, Select, Checkbox ou Radio de @/components/ui para manter o padrão compartilhado.',
        },
      ],
    },
  },
  prettier,
  shared,
  {
    files: ['src/**/*.{js,jsx}'],
    ignores: ['**/*.test.js'],
    plugins: { project },
    rules: { 'project/file-purpose': 'error' },
  },
  {
    files: ['src/modules/**/*.api.js'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'react',
                'react-dom',
                'react-router-dom',
                '**/components/**',
                '**/pages/**',
                '**/hooks/**',
              ],
              message:
                'Arquivos .api.js contêm apenas transporte e contratos; interface e estado pertencem a components/pages/hooks.',
            },
          ],
        },
      ],
    },
  },
]);
