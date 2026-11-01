import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { mockArtifactByKind } from '@/mocks/artifacts/artifacts.fixtures'
import { PROJECT_IDS } from '@/mocks/shared/mock-ids.constants'
import { setPathname } from '@/test/next-mocks.utils'
import { TestProviders } from '@/test/TestProviders'

import { ArtifactPanel } from '../ArtifactPanel'

vi.mock('next/navigation', async () => (await import('@/test/next-mocks.utils')).navigationMock)
vi.mock('next/link', async () => (await import('@/test/next-mocks.utils')).linkMock)

beforeEach(() => {
  setPathname('/')
})

function renderPanel() {
  const analysis = mockArtifactByKind(PROJECT_IDS.mentor, 'requirements_analysis')
  render(
    <ArtifactPanel
      projectId={PROJECT_IDS.mentor}
      artifacts={[{ id: analysis.id, title: analysis.title, version: analysis.version }]}
    />,
    { wrapper: TestProviders },
  )
}

describe('ArtifactPanel', () => {
  it('shows the artifact under review, and marks the items that the user changed with an M', async () => {
    renderPanel()

    expect(screen.getByRole('tab', { name: 'Requirements analysis v4' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    const edited = await screen.findByTitle('Edited by you')
    expect(edited).toHaveTextContent('M')
    expect(edited.parentElement).toHaveTextContent('AR-007')
    expect(screen.getAllByTitle('Edited by you')).toHaveLength(1)
  })

  it('opens an item inside the panel, and goes back to the artifact', async () => {
    renderPanel()

    await userEvent.click(
      await screen.findByRole('button', { name: /A booking runs in two layers/ }),
    )

    expect(await screen.findByRole('heading', { name: /AR-007/ })).toBeVisible()
    expect(screen.queryByRole('link', { name: /Requirements analysis/ })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Back to Requirements analysis/ }))
    expect(await screen.findByRole('heading', { name: 'Requirements analysis' })).toBeVisible()
    expect(within(screen.getByRole('tabpanel')).getAllByRole('table').length).toBeGreaterThan(0)
  })
})
