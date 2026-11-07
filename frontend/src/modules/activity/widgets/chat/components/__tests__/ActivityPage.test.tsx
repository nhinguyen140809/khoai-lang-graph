import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { projectIds } from '@/mocks/shared/db'
import { openPage } from '@/test/msw'
import { setQuery } from '@/test/next-stubs'
import { renderWithProviders } from '@/test/render'
import { expectNoAccessibilityViolations } from '@/test/steps'

import { ActivityPage } from '../ActivityPage'

describe('ActivityPage', () => {
  it('shows the runs of the thread oldest first, with their separators', async () => {
    renderWithProviders(<ActivityPage projectId={projectIds.mentor} />)

    expect(await screen.findByText('Also ask about group sessions.')).toBeInTheDocument()
    expect(
      screen.getByText(
        'I want to build an online platform for university students to find mentors.',
      ),
    ).toBeInTheDocument()
  })

  it('shows the review card of the run that waits for the user, as a polite live region', async () => {
    renderWithProviders(<ActivityPage projectId={projectIds.mentor} />)

    const prompt = await screen.findByText(
      'Review the requirements analysis. Accept it, or reject it with feedback.',
    )
    // The card is the one state that waits for the user: it announces itself once.
    expect(prompt.closest('[role="status"]')).not.toBeNull()
  })

  it('offers to send a message again when no agent will ever read it', async () => {
    openPage('/?mock-run-status=done')
    renderWithProviders(<ActivityPage projectId={projectIds.mentor} />)

    await screen.findByText('Not read: the work ended before this message.')
    expect(screen.getByRole('button', { name: 'Send it again' })).toBeInTheDocument()
  })

  it('shows a message that no run took in as the bubble of the user, after the runs', async () => {
    renderWithProviders(<ActivityPage projectId={projectIds.campus} />)

    const first = await screen.findByText(
      'Students order food from the campus canteens and pick it up.',
    )
    const unrun = screen.getByText('Let a group of students order and pay together.')
    expect(first.compareDocumentPosition(unrun)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  })

  it('shows the prompt under the chat', async () => {
    renderWithProviders(<ActivityPage projectId={projectIds.mentor} />)

    expect(await screen.findByPlaceholderText('Ask or request a change')).toBeInTheDocument()
  })

  it('shows the empty state and focuses the prompt when the project has no thread', async () => {
    openPage('/?mock-threads=empty')
    renderWithProviders(<ActivityPage projectId={projectIds.mentor} />)

    expect(await screen.findByText('No activity yet')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Ask or request a change')).toHaveFocus()
    })
  })

  it('names the target entry the address gives', async () => {
    setQuery('?entry=i1')
    renderWithProviders(<ActivityPage projectId={projectIds.mentor} />)

    await waitFor(() => {
      expect(screen.queryByPlaceholderText('Ask or request a change')).toBeInTheDocument()
    })
  })

  it('has no accessibility violation', async () => {
    renderWithProviders(<ActivityPage projectId={projectIds.mentor} />)

    await screen.findByText('Also ask about group sessions.')
    await expectNoAccessibilityViolations()
  })
})
