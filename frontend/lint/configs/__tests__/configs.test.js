import { ESLint } from 'eslint'
import { describe, expect, it } from 'vitest'

import { moduleImports } from '../../lib/modules/module-imports.constants.js'
import { frontendRoot } from '../../lib/paths.utils.js'
import fileNames from '../file-names.js'

describe('the resolved config', () => {
  const eslint = new ESLint({ cwd: frontendRoot })

  /** @param {string} filePath @param {string} rule */
  async function ruleOf(filePath, rule) {
    const config = await eslint.calculateConfigForFile(filePath)
    return /** @type {unknown[]} */ (config.rules?.[rule])
  }

  it('keeps a hook out of the file of a component, and in a hook file', async () => {
    const component = await ruleOf(
      'src/modules/project/widgets/list/components/ProjectList.tsx',
      'no-restricted-syntax',
    )
    expect(JSON.stringify(component)).toContain('use[A-Z]')
    const hook = await ruleOf(
      'src/modules/project/widgets/list/hooks/useProjects.ts',
      'no-restricted-syntax',
    )
    expect(JSON.stringify(hook)).not.toContain('Hooks of a slice')
  })

  it('gives a lone component at the root of a feature or a widget the rules of the components', async () => {
    const rule = await ruleOf(
      'src/modules/project/widgets/menu/ProjectSwitcher.tsx',
      'no-restricted-imports',
    )
    expect(JSON.stringify(rule)).toContain('through a hook of its slice')
  })

  it('keeps the queries and the API out of the utils files of the slices', async () => {
    const utils = await ruleOf(
      'src/modules/thread/entities/threads.utils.ts',
      'no-restricted-syntax',
    )
    expect(JSON.stringify(utils)).toContain('holds pure helpers')
    const shared = await ruleOf(
      'src/shared/api/query-client/page-items.utils.ts',
      'no-restricted-syntax',
    )
    expect(JSON.stringify(shared)).not.toContain('holds pure helpers')
  })

  it('lets the routing files of Next.js export a default', async () => {
    const page = await ruleOf('src/app/page.tsx', 'no-restricted-syntax')
    expect(JSON.stringify(page)).not.toContain('named export')
  })

  it('lets a page or a layout export the route configs of Next.js under their own names', async () => {
    expect(await ruleOf('src/app/(auth)/login/page.tsx', 'local/boolean-name')).toEqual([0])
    expect(
      await ruleOf(
        'src/modules/project/widgets/list/components/ProjectList.tsx',
        'local/boolean-name',
      ),
    ).toEqual([2])
  })

  it('keeps the UI components out of the naming rules of the app', async () => {
    const rule = await ruleOf(
      'src/shared/components/ui/button.tsx',
      '@typescript-eslint/naming-convention',
    )
    expect(rule).toHaveLength(2)
  })

  it('keeps the files of a topic of the entities to the topics that it reads, but not its tests', async () => {
    const source = await ruleOf(
      'src/modules/run/entities/steps/run-steps.utils.ts',
      'no-restricted-imports',
    )
    expect(JSON.stringify(source)).toContain('topicEntityModules')
    const test = await ruleOf(
      'src/modules/run/entities/steps/__tests__/run-steps.utils.test.ts',
      'no-restricted-imports',
    )
    expect(JSON.stringify(test)).not.toContain('topicEntityModules')
  })

  it('gives the new topics of trace their one-way reads, and keeps traceability listed with no cycle', async () => {
    const issues = await ruleOf(
      'src/modules/trace/entities/issues/issues.utils.ts',
      'no-restricted-imports',
    )
    expect(JSON.stringify(issues)).toContain('issues reads links')
    const graph = await ruleOf(
      'src/modules/trace/entities/graph/hooks/useGraphQueries.ts',
      'no-restricted-imports',
    )
    expect(JSON.stringify(graph)).toContain('graph reads chains, links, issues, traceability')
    // The table above resolves for every module on disk, so traceability is listed above the
    // modules it reads without a cycle; the module itself comes with its widgets.
    expect(moduleImports.traceability).toEqual([
      'workflow',
      'artifact',
      'trace',
      'run',
      'review',
      'thread',
      'project',
      'documents',
    ])
  })

  it('keeps the browser environment in the files that own it', async () => {
    const source = await ruleOf(
      'src/modules/project/entities/projects.api.ts',
      'no-restricted-globals',
    )
    expect(JSON.stringify(source)).toContain('The router owns the address')
    const owner = await ruleOf('src/shared/lib/viewport/scroll.utils.ts', 'no-restricted-globals')
    expect(JSON.stringify(owner)).not.toContain('The router owns the address')
    const test = await ruleOf(
      'src/modules/project/entities/__tests__/projects.api.test.ts',
      'no-restricted-globals',
    )
    expect(JSON.stringify(test)).not.toContain('The router owns the address')
  })

  it('keeps the locale of a written value in the formatters', async () => {
    const source = await ruleOf(
      'src/modules/project/entities/projects.api.ts',
      'no-restricted-properties',
    )
    expect(JSON.stringify(source)).toContain('formatLocale')
    const owner = await ruleOf(
      'src/shared/lib/numbers/formatters.utils.ts',
      'no-restricted-properties',
    )
    expect(JSON.stringify(owner)).not.toContain('formatLocale')
  })

  it('has the rules of every concern', async () => {
    const config = await eslint.calculateConfigForFile(
      'src/modules/project/entities/projects.api.ts',
    )
    for (const rule of [
      'no-restricted-imports',
      'no-restricted-syntax',
      'no-restricted-globals',
      'check-file/filename-naming-convention',
      'check-file/folder-naming-convention',
      'local/boolean-name',
      'simple-import-sort/imports',
    ]) {
      expect(config.rules).toHaveProperty([rule])
    }
  })
})

describe('the rules of file names', () => {
  const eslint = new ESLint({
    cwd: frontendRoot,
    overrideConfigFile: true,
    overrideConfig: fileNames,
  })

  /** @param {string} filePath */
  async function problemsOf(filePath) {
    const [result] = await eslint.lintText('export const a = 1\n', { filePath })
    return result?.messages.map((problem) => problem.ruleId) ?? []
  }

  it('accepts <subject>.<kind>.ts with a kind of the place', async () => {
    expect(await problemsOf('src/modules/project/entities/projects.api.ts')).toEqual([])
  })

  it('rejects a kind that the place does not hold', async () => {
    expect(await problemsOf('src/modules/project/entities/projects.fixtures.ts')).toContain(
      'check-file/filename-naming-convention',
    )
  })

  it('accepts a lone hook at the root of a feature or a widget, with its tests', async () => {
    for (const filePath of [
      'src/modules/run/features/start/useStartRun.ts',
      'src/modules/project/widgets/list/useProjectFilterFields.ts',
      'src/modules/run/features/start/__tests__/useStartRun.test.ts',
      'src/modules/run/features/start/__tests__/useStartRun.data.ts',
    ]) {
      expect(await problemsOf(filePath)).toEqual([])
    }
  })

  it('rejects a hook outside hooks/ elsewhere', async () => {
    for (const filePath of [
      'src/modules/run/entities/runs/useRuns.ts',
      'src/modules/project/entities/useProjects.ts',
      'src/modules/project/features/create/components/useThing.ts',
      'src/shared/lib/scheduling/useClock.ts',
    ]) {
      expect(await problemsOf(filePath)).toContain('check-file/filename-naming-convention')
    }
  })

  it('rejects a folder that is not kebab-case', async () => {
    expect(await problemsOf('src/shared/Bad_Folder/thing.utils.ts')).toContain(
      'check-file/folder-naming-convention',
    )
  })
})
