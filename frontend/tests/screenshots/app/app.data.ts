import type { Page } from '@playwright/test'

import { projectIds } from '../../../src/mocks/shared/mock-ids.constants'
import { type Shot, visit } from '../screenshot.utils'

const failed = (page: Page) => page.getByRole('heading', { name: 'Something went wrong' })

/**
 * The states of the app as a whole, and the steps to each: an address with no page, and a page
 * that fails to render, in the frame of the screens outside a project and of a project. The pages
 * that fail exist only while developing.
 */
export const appShots: Shot[] = [
  { name: 'Page not found', steps: visit('/no-such-page') },
  {
    name: 'A screen outside a project that fails to render',
    steps: visit('/render-error'),
    ready: failed,
  },
  {
    name: 'A screen of a project that fails to render',
    steps: visit(`/projects/${projectIds.mentor}/render-error`),
    ready: failed,
  },
]
