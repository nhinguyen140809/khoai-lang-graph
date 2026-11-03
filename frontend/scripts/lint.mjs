// Runs ESLint in several processes, so that each process stays within a small Node.js heap
// (LINT_MAX_OLD_SPACE, in MB, 1536 by default). The type-aware rules build a TypeScript program:
// one process for the whole project loads every file of the project and keeps the types it
// checks. Here each process lints one group of folders, with a TypeScript program of that group
// only: its files, the files they import, and the declarations every file needs. The groups run
// side by side, one process for every two cores of the machine at most (LINT_JOBS overrides the
// count, as LINT_MAX_OLD_SPACE does the heap).
//
// Usage: node scripts/lint.mjs [ESLint options], for example `node scripts/lint.mjs --fix`.
import { spawn } from 'node:child_process'
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { cpus } from 'node:os'
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

const run = (group) =>
  new Promise((resolve) => {
    const args = [
      eslintBin,
      ...group.lint.map((entry) => entry.path),
      ...(group.ignore ?? []).flatMap((pattern) => ['--ignore-pattern', pattern]),
      // A folder can be empty until its first code.
      '--no-error-on-unmatched-pattern',
      ...eslintOptions,
    ]
    console.log(`\nESLint: ${group.lint.map((entry) => entry.path).join(' ')}`)
    const child = spawn(process.execPath, args, {
      cwd: root,
      stdio: 'inherit',
      env: {
        ...process.env,
        ESLINT_TSCONFIG: writeTsconfig(group),
        NODE_OPTIONS: `--max-old-space-size=${process.env.LINT_MAX_OLD_SPACE ?? '1536'}`,
      },
    })
    child.on('close', (code) => {
      if (code !== 0) failed.push(group.name)
      resolve()
    })
  })

const pending = groups.filter((group) => group.lint.length > 0)
const workers =
  Number.parseInt(process.env.LINT_JOBS ?? '', 10) || Math.max(1, Math.floor(cpus().length / 2))
await Promise.all(
  Array.from({ length: Math.min(pending.length, workers) }, () => {
    const take = () => {
      const group = pending.shift()
      return group === undefined ? undefined : run(group).then(take)
    }
    return take()
  }),
)

if (failed.length > 0) {
  console.error(`\nESLint found problems or failed in: ${failed.join(', ')}`)
  process.exit(1)
}
