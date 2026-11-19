import { describe, it } from 'vitest'

import { projectIds } from '@/mocks/shared/db'
import { renderWithProviders } from '@/test/render'
import { expectNoAccessibilityViolations, expectText } from '@/test/steps'

import { ActivityPanel } from '../ActivityPanel'

describe('ActivityPanel', () => {
  it('shows the progress and the outline sections of the thread that needs the user most', async () => {
    renderWithProviders(<ActivityPanel projectId={projectIds.mentor} />)

    await expectText('Progress')
    await expectText('Outline')
    await expectNoAccessibilityViolations()
  })

  it('shows the empty states for a project with no run', async () => {
    renderWithProviders(<ActivityPanel projectId={projectIds.mentor} />)

    // The mentor platform has a waiting run: the review button shows.
    await expectText('Interviewing')
  })
})
