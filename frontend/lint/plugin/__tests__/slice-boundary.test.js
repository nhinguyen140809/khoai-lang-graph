import path from 'node:path'

import { frontendRoot } from '../../lib/paths.utils.js'
import { sliceBoundary } from '../slice-boundary.js'
import { createRuleTester } from './typed-rule-tester.js'

/** @param {string} file */
const inSrc = (file) => path.join(frontendRoot, 'src', file)

const featureFile = inSrc('modules/project/features/new-project/components/form/NewProjectForm.tsx')
const entityFile = inSrc('modules/project/entities/types/projects.types.ts')

createRuleTester().run('slice-boundary', sliceBoundary, {
  valid: [
    { code: "import { a } from '../../hooks/useA'", filename: featureFile },
    { code: "import { a } from './Other'", filename: featureFile },
    { code: "import { a } from '@/shared/lib/storage'", filename: featureFile },
    { code: "import { a } from '../utils/projects.utils'", filename: entityFile },
    { code: "export { a } from '../../components/A'", filename: featureFile },
    // not a slice: shared code is checked by other rules
    { code: "import { a } from '../../../x'", filename: inSrc('shared/lib/a.utils.ts') },
  ],
  invalid: [
    {
      code: "import { a } from '../../../other-feature'",
      filename: featureFile,
      errors: [{ messageId: 'leaves' }],
    },
    {
      code: "export * from '../../../../../shared/x'",
      filename: featureFile,
      errors: [{ messageId: 'leaves' }],
    },
    {
      code: "import { a } from '../../other-entity'",
      filename: entityFile,
      errors: [{ messageId: 'leaves' }],
    },
    {
      code: "const lazy = import('../../../x')",
      filename: featureFile,
      errors: [{ messageId: 'leaves' }],
    },
  ],
})
