import { ESLint } from 'eslint'
import { describe, expect, it } from 'vitest'

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

  it('lets the routing files of Next.js export a default', async () => {
    const page = await ruleOf('src/app/page.tsx', 'no-restricted-syntax')
    expect(JSON.stringify(page)).not.toContain('named export')
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

  it('rejects a folder that is not kebab-case', async () => {
    expect(await problemsOf('src/shared/Bad_Folder/thing.utils.ts')).toContain(
      'check-file/folder-naming-convention',
    )
  })
})
