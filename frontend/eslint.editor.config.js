import tseslint from 'typescript-eslint'

import config from './eslint.config.js'

// Editor-only variant: the same rules without the ones that need type information, so the
// ESLint server does not load the TypeScript project. `pnpm lint` and CI use eslint.config.js,
// which keeps the type-aware rules.
export default [
  ...config,
  {
    files: ['**/*.{ts,tsx}'],
    ...tseslint.configs.disableTypeChecked,
  },
]
