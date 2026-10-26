import { globalIgnores } from 'eslint/config'

export default [
  globalIgnores([
    '.next',
    'next-env.d.ts',
    'coverage',
    'playwright-report',
    'test-results',
    'src/shared/api/generated',
    'public/mockServiceWorker.js',
  ]),
]
