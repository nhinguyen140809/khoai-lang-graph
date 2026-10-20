// Runs ESLint in several processes, one after another, so that each process stays within a small
// Node.js heap (for example NODE_OPTIONS=--max-old-space-size=768). The type-aware rules build a
// TypeScript program: one process for the whole project loads every file of the project and keeps
// the types it checks. Here each process lints one group of folders, with a TypeScript program
// of that group only: its files, the files they import, and the declarations every file needs.
//
// Usage: node scripts/lint.mjs [ESLint options], for example `node scripts/lint.mjs --fix`.
import { spawnSync } from 'node:child_process'
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const configDir = path.join(root, 'node_modules', '.cache', 'lint-groups')
const eslintBin = path.join(root, 'node_modules', 'eslint', 'bin', 'eslint.js')

// Declarations that files rely on without importing them: environment variables, Next.js and
// its route types, and the matchers that the unit test setup adds.
const declarations = [
  'src/env.d.ts',
  'next-env.d.ts',
  '.next/types/**/*.ts',
  '.next/dev/types/**/*.ts',
  'src/test/vitest.setup.ts',
]

function entries(folder) {
  return readdirSync(path.join(root, folder), { withFileTypes: true }).map((entry) => ({
    path: `${folder}/${entry.name}`,
    isDirectory: entry.isDirectory(),
  }))
}

const modules = entries('src/modules')
const isDesignSystem = (entry) => entry.path === 'src/modules/design-system'

// Every file is in exactly one group: the folders of src/ are listed as they are on disk, and the
// last group takes everything outside src/.
const groups = [
  // The design system page imports every UI component, so it has a process of its own.
  { name: 'design-system', lint: modules.filter(isDesignSystem) },
  { name: 'modules', lint: modules.filter((entry) => !isDesignSystem(entry)) },
  {
    name: 'app-and-shared',
    lint: entries('src').filter((entry) => entry.path !== 'src/modules'),
  },
  {
    name: 'tests-and-config',
    lint: [{ path: '.', isDirectory: true }],
    ignore: ['src/**'],
    program: ['tests/**/*', '*.config.ts'],
  },
]

function writeTsconfig(group) {
  const toRoot = path.relative(configDir, root)
  const program =
    group.program ??
    group.lint.map((entry) => (entry.isDirectory ? `${entry.path}/**/*` : entry.path))
  const tsconfig = {
    extends: path.join(toRoot, 'tsconfig.json'),
    compilerOptions: { incremental: false },
    include: [...program, ...declarations].map((pattern) => path.join(toRoot, pattern)),
  }
  const file = path.join(configDir, `tsconfig.${group.name}.json`)
  writeFileSync(file, `${JSON.stringify(tsconfig, null, 2)}\n`)
  return file
}

mkdirSync(configDir, { recursive: true })
const eslintOptions = process.argv.slice(2)
const failed = []

for (const group of groups) {
  if (group.lint.length === 0) continue
  const args = [
    eslintBin,
    ...group.lint.map((entry) => entry.path),
    ...(group.ignore ?? []).flatMap((pattern) => ['--ignore-pattern', pattern]),
    // A folder can be empty until its first code.
    '--no-error-on-unmatched-pattern',
    ...eslintOptions,
  ]
  console.log(`\nESLint: ${group.lint.map((entry) => entry.path).join(' ')}`)
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, ESLINT_TSCONFIG: writeTsconfig(group) },
  })
  if (result.status !== 0) failed.push(group.name)
}

if (failed.length > 0) {
  console.error(`\nESLint found problems or failed in: ${failed.join(', ')}`)
  process.exit(1)
}
