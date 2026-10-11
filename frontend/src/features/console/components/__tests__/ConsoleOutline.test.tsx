import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { THREAD_IDS } from '@/mocks/mock-ids.constants'
import { TestProviders } from '@/test/TestProviders'

import { useCommandHistoryStore } from '../../command-history.store'
import { eventDomId } from '../../event-log.utils'
import { isFollowingLog } from '../../event-scroll.utils'
import { ConsoleOutline } from '../ConsoleOutline'

beforeEach(() => {
  useCommandHistoryStore.setState({ commands: {} })
})

afterEach(() => {
  document.body.innerHTML = ''
})

describe('ConsoleOutline', () => {
  it('lists each message and command of the user, oldest first', async () => {
    useCommandHistoryStore.getState().record(THREAD_IDS.mentorMain, 'expand')
    render(<ConsoleOutline threadId={THREAD_IDS.mentorMain} />, { wrapper: TestProviders })

    const list = await screen.findByRole('list', { name: 'Inputs of the console' })
    const items = within(list).getAllByRole('listitem')

    expect(items).toHaveLength(4)
    expect(items[0]).toHaveTextContent('I want to build an online platform')
    expect(items[1]).toHaveTextContent('Group sessions are needed too')
    expect(items[2]).toHaveTextContent('Also ask the mentors how they want to be paid.')
    expect(items[3]).toHaveTextContent('/expand')
  })

  it('scrolls the event log to the one that was chosen', async () => {
    render(<ConsoleOutline threadId={THREAD_IDS.mentorMain} />, { wrapper: TestProviders })
    const button = await screen.findByRole('button', { name: /Group sessions are needed too/ })
    const messageId = 'c2a10000-0000-4000-8000-000000000003'
    const target = document.createElement('div')
    target.id = eventDomId(messageId)
    const scroll = vi.fn()
    target.scrollIntoView = scroll
    document.body.append(target)

    await userEvent.click(button)

    expect(scroll).toHaveBeenCalledOnce()
    expect(target.dataset.flash).toBe('true')
    // What arrives next must not take the reader away from the event.
    expect(isFollowingLog()).toBe(false)
  })

  it('says when nothing was typed yet', async () => {
    render(<ConsoleOutline threadId="no-such-thread" />, { wrapper: TestProviders })

    expect(await screen.findByText('Nothing typed yet')).toBeInTheDocument()
  })
})
