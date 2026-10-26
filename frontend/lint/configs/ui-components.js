import { defineConfig } from 'eslint/config'

export default defineConfig([
  {
    // shadcn/ui code is copied from the registry. Keep it close to upstream so
    // `shadcn add --overwrite` diffs stay small; only relax stylistic type rules here.
    files: ['src/shared/components/ui/**/*.{ts,tsx}'],
    rules: {
      'react-hooks/set-state-in-effect': 'off',
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/no-confusing-void-expression': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      'jsx-a11y/anchor-has-content': 'off',
    },
  },
  {
    // Recharts payloads are typed as `any` upstream.
    files: ['src/shared/components/ui/chart.tsx'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
    },
  },
])
