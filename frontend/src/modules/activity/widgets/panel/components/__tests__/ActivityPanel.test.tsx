import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { projectIds } from '@/mocks/shared/db'
import { renderWithProviders } from '@/test/render'
import { expectNoAccessibilityViolations } from '@/test/steps'

import { ActivityPanel } from '../ActivityPanel'

describe('ActivityPanel', () => {
  it('shows the progress and the outline sections of the thread that needs the user most', async () => {
    renderWithProviders(<ActivityPanel projectId={projectIds.mentor} />)

    expect(await screen.findByText('Progress')).toBeInTheDocument()
    expect(screen.getByText('Outline')).toBeInTheDocument()
    await expectNoAccessibilityViolations()
  })

  it('shows the empty states for a project with no run', async () => {
    renderWithProviders(<ActivityPanel projectId={projectIds.mentor} />)

    // The mentor platform has a waiting run: the review button shows.
    expect(await screen.findByText('Interviewing')).toBeInTheDocument()
  })
})
