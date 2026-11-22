import path from 'node:path'

import { frontendRoot } from '../../lib/paths.utils.js'
import { viewBoundary } from '../view-boundary.js'
import { createTypedRuleTester } from './typed-rule-tester.js'

/** @param {string} file */
const inSrc = (file) => path.join(frontendRoot, 'src', file)

const userPage = inSrc('app/user/(home)/layout.tsx')
const developerPage = inSrc('app/developer/(home)/layout.tsx')

createTypedRuleTester().run('view-boundary', viewBoundary, {
  valid: [
    // what is marked for the view of the page
    { code: "import { Desk } from '@/shared/components/frame'", filename: userPage },
    { code: "import { Workbench } from '@/shared/components/frame'", filename: developerPage },
    // a name that is given again by an index is followed to its declaration
    {
      code: "import { ProjectHeading } from '@/modules/project/widgets/heading'",
      filename: userPage,
    },
    // what has no tag is shared
    { code: "import { PageColumn } from '@/shared/components/frame'", filename: userPage },
    { code: "import { PageColumn } from '@/shared/components/frame'", filename: developerPage },
    // a type is read like a value
    { code: "import type { SidebarLayout } from '@/shared/components/frame'", filename: userPage },
    // a file that is not a page of a view is not checked
    {
      code: "import { Desk } from '@/shared/components/frame'",
      filename: inSrc('modules/project/widgets/sidebar/components/ProjectSidebar.tsx'),
    },
  ],
  invalid: [
    {
      code: "import { Workbench } from '@/shared/components/frame'",
      filename: userPage,
      errors: [
        { messageId: 'otherView', data: { name: 'Workbench', tagged: 'developer', own: 'user' } },
      ],
    },
    {
      code: "import { Desk } from '@/shared/components/frame'",
      filename: developerPage,
      errors: [
        { messageId: 'otherView', data: { name: 'Desk', tagged: 'user', own: 'developer' } },
      ],
    },
    {
      code: "import { ProjectListPage } from '@/modules/project/widgets/list'",
      filename: userPage,
      errors: [{ messageId: 'otherView' }],
    },
    {
      code: "import { ProjectHeading } from '@/modules/project/widgets/heading'",
      filename: developerPage,
      errors: [
        { messageId: 'otherView', data: { name: 'ProjectHeading', tagged: 'user', own: 'developer' } },
      ],
    },
    {
      code: "import type { SidebarLayout } from '@/shared/components/frame'",
      filename: developerPage,
      errors: [{ messageId: 'otherView' }],
    },
  ],
})
