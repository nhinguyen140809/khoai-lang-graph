import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { projectIds } from '@/mocks/shared/db'
import { openPage } from '@/test/msw'
import { renderWithProviders } from '@/test/render'

import { OpenIssuesPage } from '../OpenIssuesPage'

const projectId = projectIds.mentor

function renderPage() {
  return renderWithProviders(<OpenIssuesPage projectId={projectId} />)
}

describe('OpenIssuesPage', () => {
  it('says what an issue is, and counts them by kind', async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Open issues' })).toBeInTheDocument()
    })
    expect(screen.getAllByRole('heading', { level: 2 }).length).toBeGreaterThan(0)
    expect(screen.getByText(openIssuesDescription)).toBeInTheDocument()
  })

  it('groups the item an issue concerns in one card, with the quoted words marked in the statement', async () => {
    const { container } = renderPage()

    // The card holds the kind over the title, which opens the item. The title is only a name, so
    // the quoted words are marked in the statement that holds them, under it.
    const title = await screen.findByRole('link', { name: 'Search within 2 seconds' })
    const card = title.closest('[data-slot="item"][data-variant="muted"]')
    if (card === null) throw new Error('The item has no card')
    expect(card).toHaveTextContent('Analysed requirement')
    expect(title.querySelector('mark')).toBeNull()
    const marks = [...container.querySelectorAll('mark')].filter(
      (mark) => mark.textContent === 'within 2 seconds',
    )
    expect(marks).toHaveLength(1)
    expect(marks[0]?.closest('[data-slot="quote-excerpt"]')).toHaveTextContent(
      'A search result is listed within 2 seconds.',
    )
    // The card is labelled with the title that the definition gives the link of the issue.
    expect(screen.getAllByText('Applies to').length).toBeGreaterThan(0)
  })

  it('shows the people of a disagreement beside its issue', async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('PER-001')).toBeInTheDocument()
    })
    expect(screen.getByText('PER-003')).toBeInTheDocument()
  })

  it('shows the empty state while the issues load and none is open yet', async () => {
    // No item at all: the read of every item answers empty, so no issue can group.
    openPage('/?mock-items=empty&mock-trace-links=empty')
    renderPage()

    await waitFor(() => {
      // With no link, no issue is open: the page shows its empty state once the query settles.
      expect(screen.getByText('No issue is open.')).toBeInTheDocument()
    })
  })
})

const openIssuesDescription =
  'Each issue is a question the agents could not settle alone; each card says where it applies.'
