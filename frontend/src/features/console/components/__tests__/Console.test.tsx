import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PROJECT_IDS, THREAD_IDS } from '@/mocks/mock-ids.constants'
import { routerMock } from '@/test/next-mocks.utils'
import { TestProviders } from '@/test/TestProviders'

import { useCommandHistoryStore } from '../../command-history.store'
import { Console } from '../Console'

vi.mock('next/navigation', async () => (await import('@/test/next-mocks.utils')).navigationMock)
vi.mock('next/link', async () => (await import('@/test/next-mocks.utils')).linkMock)

beforeEach(() => {
  useCommandHistoryStore.setState({ commands: {} })
  // The stream is played by the browser worker; the unit tests only need it not to fail.
  vi.stubGlobal(
    'EventSource',
    class {
      addEventListener() {
        // No events.
      }
      close() {
        // Nothing to close.
      }
    },
  )
})

// The mentor platform has a run that waits for review; the campus project has none.
const mentor = { projectId: PROJECT_IDS.mentor, threadId: THREAD_IDS.mentorMain }
const campus = { projectId: PROJECT_IDS.campus, threadId: THREAD_IDS.campusMain }

function renderConsole(project = mentor) {
  render(<Console {...project} />, { wrapper: TestProviders })
}

describe('Console', () => {
  it('prints the events of the runs as rows, and the review that waits', async () => {
    renderConsole()

    const log = await screen.findByRole('log', { name: 'Event log' })
    expect(await within(log).findByText(/online platform for university students/)).toBeVisible()
    expect(within(log).getAllByText('planner').length).toBeGreaterThan(0)
    expect(within(log).getByText(/Run 3 started, retrying run 2/)).toBeVisible()
    expect(within(log).getByText(/Run 2 failed: The next model call/)).toBeVisible()
    expect(
      await within(log).findByText(/Requirements analysis v4 waits for your review/),
    ).toBeVisible()
  })

  it('shows the turns of an interview as one row that opens into its steps', async () => {
    renderConsole()

    const groups = await screen.findAllByRole('button', { name: /interviewing/ })
    const group = groups[0]
    if (group === undefined) throw new Error('No group')
    expect(group).toHaveAttribute('aria-expanded', 'false')
    expect(group).toHaveTextContent('24 steps')

    await userEvent.click(group)

    expect(group).toHaveAttribute('aria-expanded', 'true')
  })

  it('sends a message that starts a run when no run is unfinished', async () => {
    renderConsole(campus)

    const input = await screen.findByRole('combobox', { name: 'Message' })
    await userEvent.type(input, 'Add a report of the orders{Enter}')

    expect(await screen.findByText('Add a report of the orders')).toBeVisible()
    expect(await screen.findByText(/Run 2 started/)).toBeVisible()
    expect(input).toHaveValue('')
  })

  it('does not send a message while a run is unfinished, and says to use a command', async () => {
    renderConsole()

    const input = await screen.findByRole('combobox', { name: 'Message' })
    await userEvent.type(input, 'One more thing{Enter}')

    expect(screen.getByText(/A run is in progress\. Use a command/)).toBeVisible()
    expect(screen.queryByText('One more thing', { selector: 'div' })).not.toBeInTheDocument()
    expect(input).toHaveValue('One more thing')
  })

  it('lists the commands for a slash, and says why one cannot run', async () => {
    renderConsole()

    const input = await screen.findByRole('combobox', { name: 'Message' })
    await userEvent.type(input, '/')

    const list = screen.getByRole('listbox', { name: 'Commands' })
    expect(within(list).getAllByRole('option')).toHaveLength(6)
    expect(within(list).getByRole('option', { name: /retry/ })).toHaveTextContent('no failed run')
    expect(within(list).getByRole('option', { name: /retry/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
    expect(within(list).getByRole('option', { name: /stop/ })).toHaveAttribute(
      'aria-disabled',
      'false',
    )
  })

  it('runs a command typed in full, and rejects an unknown one', async () => {
    renderConsole()

    const input = await screen.findByRole('combobox', { name: 'Message' })
    await userEvent.type(input, '/nothing {Enter}')
    expect(screen.getByText('Unknown command: /nothing')).toBeVisible()

    await userEvent.clear(input)
    await userEvent.type(input, '/expand {Enter}')

    expect(screen.getByText('ctrl+o collapse steps')).toBeVisible()
    // The command is an event of the log, like the message that starts a run.
    expect(
      within(screen.getByRole('log', { name: 'Event log' })).getByText('/expand'),
    ).toBeVisible()
  })

  it('opens the settings of the runs with /run-settings', async () => {
    renderConsole()

    await userEvent.type(
      await screen.findByRole('combobox', { name: 'Message' }),
      '/run-settings {Enter}',
    )

    expect(routerMock.push).toHaveBeenCalledWith(
      `/projects/${PROJECT_IDS.mentor}/settings?section=runs`,
    )
  })

  it('mentions an item by its key in a message', async () => {
    renderConsole(campus)

    const input = await screen.findByRole('combobox', { name: 'Message' })
    await userEvent.type(input, 'check @REQ-001')
    await userEvent.click(await screen.findByRole('option', { name: /REQ-001/ }))

    expect(input).toHaveValue('check @REQ-001 ')
  })

  it('stops the run on a second Esc', async () => {
    renderConsole()

    const input = await screen.findByRole('combobox', { name: 'Message' })
    await userEvent.type(input, '{Escape}')
    expect(screen.getByText('press esc again to stop the run')).toBeVisible()

    await userEvent.type(input, '{Escape}')

    expect(await screen.findByText(/Run 3 stopped/)).toBeVisible()
  })
})
