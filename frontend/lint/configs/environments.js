import { defineConfig } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  {
    // The config files and the tests of Playwright run in Node.js.
    files: ['*.config.{ts,js,mjs}', 'tests/**/*.ts'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    // The JavaScript files are not part of the TypeScript project.
    files: ['**/*.{js,mjs}'],
    extends: [tseslint.configs.disableTypeChecked],
  },
])
