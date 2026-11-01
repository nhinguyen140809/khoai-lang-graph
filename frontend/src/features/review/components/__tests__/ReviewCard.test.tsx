import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { pendingInterrupt } from '@/mocks/runs/interrupts.handlers'
import { mockRuns } from '@/mocks/runs/runs.fixtures'
import { RUN_IDS } from '@/mocks/shared/mock-ids.constants'
import { TestProviders } from '@/test/TestProviders'

import { ReviewCard } from '../ReviewCard'

function interruptOfRun3() {
  const run = mockRuns('waiting').find(({ id }) => id === RUN_IDS.mentorMain3)
  const interrupt = run === undefined ? null : pendingInterrupt(run)
  if (interrupt === null) throw new Error('No review')
  return interrupt
}

afterEach(() => {
  window.history.pushState({}, '', '/')
})

describe('ReviewCard', () => {
  it('shows what is asked, what is under review and what the user edited, with the default chosen', async () => {
    render(<ReviewCard interrupt={interruptOfRun3()} onDone={vi.fn()} />, {
      wrapper: TestProviders,
    })

    expect(screen.getByText(/Review the requirements analysis/)).toBeVisible()
    expect(screen.getByText(/Under review: Requirements analysis v4/)).toBeVisible()
    expect(await screen.findByText(/Edited by you: AR-007 v2/)).toBeVisible()
    const options = screen.getByRole('radiogroup', { name: 'Options' })
    expect(within(options).getAllByRole('radio')).toHaveLength(3)
    expect(within(options).getByRole('radio', { name: /1\. Accept/ })).toHaveAttribute(
      'aria-checked',
      'true',
    )
  })

  it('asks for the feedback that an option needs, and sends the answer with it', async () => {
    const onDone = vi.fn()
    render(<ReviewCard interrupt={interruptOfRun3()} onDone={onDone} />, { wrapper: TestProviders })

    await userEvent.click(screen.getByRole('radio', { name: /3\. Reject and re-interview/ }))
    expect(screen.getByText('Feedback (required)')).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Send' }))
    expect(await screen.findByText('Write the feedback.')).toBeVisible()
    expect(onDone).not.toHaveBeenCalled()

    await userEvent.type(screen.getByRole('textbox'), 'Ask the admin again.')
    await userEvent.click(screen.getByRole('button', { name: 'Send' }))

    expect(onDone).toHaveBeenCalledOnce()
  })

  it('chooses an option with the keys, and leaves the review for later on Esc', async () => {
    const onDone = vi.fn()
    render(<ReviewCard interrupt={interruptOfRun3()} onDone={onDone} />, { wrapper: TestProviders })
    const accept = screen.getByRole('radio', { name: /1\. Accept/ })
    accept.focus()

    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByRole('radio', { name: /2\. Reject and re-analyse/ })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    await userEvent.keyboard('3')
    expect(screen.getByRole('radio', { name: /3\. Reject and re-interview/ })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    await userEvent.keyboard('{Escape}')

    expect(onDone).toHaveBeenCalledOnce()
  })

  it('draws the questions of a checkpoint by their type, with the default answers', () => {
    window.history.pushState({}, '', '/?mock-review=questions')
    render(<ReviewCard interrupt={interruptOfRun3()} onDone={vi.fn()} />, {
      wrapper: TestProviders,
    })

    const users = screen.getByRole('group', { name: 'Who will use the platform? (choose any)' })
    expect(within(users).getByRole('checkbox', { name: /Students/ })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    expect(within(users).getByRole('checkbox', { name: /Someone else/ })).toHaveAttribute(
      'aria-checked',
      'false',
    )
    expect(
      screen.getByRole('radiogroup', { name: 'Should the first version take payments?' }),
    ).toBeVisible()
    expect(screen.getByRole('spinbutton', { name: /How many sessions/ })).toHaveValue(2)
    expect(screen.getByRole('textbox', { name: /Anything else/ })).toBeVisible()
    expect(screen.queryByRole('radiogroup', { name: 'Options' })).not.toBeInTheDocument()
  })

  it('names the question that is not answered, and asks for the words of a choice', async () => {
    window.history.pushState({}, '', '/?mock-review=questions')
    render(<ReviewCard interrupt={interruptOfRun3()} onDone={vi.fn()} />, {
      wrapper: TestProviders,
    })
    const users = screen.getByRole('group', { name: 'Who will use the platform? (choose any)' })

    await userEvent.click(within(users).getByRole('checkbox', { name: /Students/ }))
    await userEvent.click(within(users).getByRole('checkbox', { name: /Mentors/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Send' }))
    expect(await screen.findByText('Choose at least one.')).toBeVisible()

    await userEvent.click(within(users).getByRole('checkbox', { name: /Someone else/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Send' }))
    expect(await screen.findByText('Say more for "Someone else, please specify".')).toBeVisible()
  })
})
