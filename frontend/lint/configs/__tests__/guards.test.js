import path from 'node:path'

import { ESLint } from 'eslint'
import { describe, expect, it } from 'vitest'

import { storageIndexPattern } from '../../lib/imports/folder-index-patterns.constants.js'
import { frontendRoot } from '../../lib/paths.utils.js'

describe('no-restricted-imports', () => {
  const eslint = new ESLint({ cwd: frontendRoot })
  const files = [
    'src/modules/project/entities/projects.api.ts',
    'src/modules/project/features/new-project/components/NewProjectForm.tsx',
    'src/modules/project/widgets/project-list/hooks/useProjects.ts',
    'src/modules/project/widgets/project-list/__tests__/ProjectList.test.tsx',
    'src/shared/lib/storage/browser-storage.utils.ts',
    'src/shared/components/frame/Frame.tsx',
    'src/mocks/projects/projects.handlers.ts',
  ]

  it.each(files)('keeps the index patterns of the folders for %s', async (file) => {
    const config = await eslint.calculateConfigForFile(path.join(frontendRoot, file))
    const rule = /** @type {[string, { patterns?: object[] }]} */ (
      config.rules?.['no-restricted-imports']
    )
    const patterns = JSON.stringify(rule[1].patterns)
    // A block replaces the rule of the blocks before it, so a block that drops a pattern that
    // every file follows has lost it, or has been put in the wrong place.
    expect(patterns).toContain(storageIndexPattern.message)
  })
})
