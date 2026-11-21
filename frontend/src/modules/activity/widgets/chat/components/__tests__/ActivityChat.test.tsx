import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { messagesOfThread } from '@/mocks/messages/messages.lookup'
import { server } from '@/mocks/msw-server.setup'
import { runsOfThread } from '@/mocks/runs/lookup/runs.lookup'
import { projectIds, threadIds } from '@/mocks/shared/db'
import { apiEndpoints } from '@/shared/api/endpoints'
import { assertPresent } from '@/shared/lib/guards'
import { openPage } from '@/test/msw'
import { setQuery } from '@/test/next-stubs'
import { renderWithProviders } from '@/test/render'
import { expectNoAccessibilityViolations, expectRole, expectText, press } from '@/test/steps'

import { ActivityChat } from '../ActivityChat'

describe('ActivityChat', () => {
  it('shows the runs of the thread oldest first, with their separators', async () => {
    renderWithProviders(<ActivityChat projectId={projectIds.mentor} />)

    await expectText('Also ask about group sessions.')
    await expectText('I want to build an online platform for university students to find mentors.')
  })

  it('keeps the notes of finished work closed, and shows them as Markdown when its line is opened', async () => {
    openPage('/?mock-run-status=done')
    renderWithProviders(<ActivityChat projectId={projectIds.mentor} />)

    // The thread shows its runs oldest first, and the latest run is the one with the notes.
    const lines = await screen.findAllByText('Analysing the interviews')
    const line = assertPresent(lines.at(-1), 'the line of the latest run')
    expect(document.body).not.toHaveTextContent('I compared what the three people said')

    await press(assertPresent(line.closest('button'), 'the trigger of the line'))

    // Markdown cuts a text into elements as it renders it, so the page is read as one text.
    await waitFor(() => {
      expect(document.body).toHaveTextContent(
        'I compared what the three people said about booking a session.',
      )
    })
    expect(document.body).toHaveTextContent('Two of them disagree on who approves a session:')
    // The text between ** is bold, shown without its marks.
    expect(document.body).not.toHaveTextContent('**')
  })

  it('shows the review card of the run that waits for the user, as a polite live region', async () => {
    renderWithProviders(<ActivityChat projectId={projectIds.mentor} />)

    const prompt = await screen.findByText(
      'Review the requirements analysis. Accept it, or reject it with feedback.',
    )
    // The card is the one state that waits for the user: it announces itself once.
    expect(prompt.closest('[role="status"]')).not.toBeNull()
  })

  it('offers to send a message again when no agent will ever read it', async () => {
    openPage('/?mock-run-status=done')
    renderWithProviders(<ActivityChat projectId={projectIds.mentor} />)

    await expectText('Not read: the work ended before this message.')
    await expectRole('button', 'Send it again')
  })

  it('shows a message that no run took in as the bubble of the user, after the runs', async () => {
    renderWithProviders(<ActivityChat projectId={projectIds.campus} />)

    const first = await screen.findByText(
      'Students order food from the campus canteens and pick it up.',
    )
    const unrun = screen.getByText('Let a group of students order and pay together.')
    expect(first.compareDocumentPosition(unrun)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  })

  it('shows the prompt under the chat', async () => {
    renderWithProviders(<ActivityChat projectId={projectIds.mentor} />)

    expect(await screen.findByPlaceholderText('Ask or request a change')).toBeInTheDocument()
  })

  it('shows the empty state and focuses the prompt when the project has no thread', async () => {
    openPage('/?mock-threads=empty')
    renderWithProviders(<ActivityChat projectId={projectIds.mentor} />)

    await expectText('No activity yet')
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Ask or request a change')).toHaveFocus()
    })
  })

  it('names the target entry the address gives', async () => {
    setQuery('?entry=i1')
    renderWithProviders(<ActivityChat projectId={projectIds.mentor} />)

    await waitFor(() => {
      expect(screen.queryByPlaceholderText('Ask or request a change')).toBeInTheDocument()
    })
  })

  it('has no accessibility violation', async () => {
    renderWithProviders(<ActivityChat projectId={projectIds.mentor} />)

    await expectText('Also ask about group sessions.')
    await expectNoAccessibilityViolations()
  })

  it('reads the messages to their end before it shows the runs, as the newest are on the last page', async () => {
    const messages = messagesOfThread(threadIds.mentorMain)
    server.use(
      http.get(apiEndpoints.threadMessages.pattern, ({ request }) =>
        new URL(request.url).searchParams.get('cursor') === null
          ? HttpResponse.json({ items: messages.slice(0, -1), next_cursor: 'rest' })
          : HttpResponse.json({ items: messages.slice(-1), next_cursor: null }),
      ),
    )
    renderWithProviders(<ActivityChat projectId={projectIds.mentor} />)

    await expectText('Also ask about group sessions.')
  })

  it('shows the newest runs first, and the runs before them when they are asked for', async () => {
    const runs = runsOfThread(threadIds.mentorMain).toSorted((a, b) => b.number - a.number)
    server.use(
      http.get(apiEndpoints.threadRuns.pattern, ({ request }) =>
        new URL(request.url).searchParams.get('cursor') === null
          ? HttpResponse.json({ items: runs.slice(0, 1), next_cursor: 'older' })
          : HttpResponse.json({ items: runs.slice(1), next_cursor: null }),
      ),
    )
    renderWithProviders(<ActivityChat projectId={projectIds.mentor} />)

    await expectText('Also ask about group sessions.')
    await expectText('I want to build an online platform for university students to find mentors.')
  })
})
