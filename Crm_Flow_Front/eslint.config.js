import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import shared from './eslint.rules.js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist']),
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
  prettier,
  shared,
]);
