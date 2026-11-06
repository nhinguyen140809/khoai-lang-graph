import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { buildRun } from '@/mocks/runs/fixtures/runs.fixtures'
import { projectIds, runIds, threadIds } from '@/mocks/shared/db'
import type { Interrupt } from '@/modules/review/entities'
import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpStatus } from '@/shared/api/http'
import { recordRequests } from '@/test/msw'
import { renderWithProviders } from '@/test/render'
import {
  expectNoAccessibilityViolations,
  pressButton,
  pressKeys,
  spyOnToast,
  typeText,
} from '@/test/steps'

import { AnswerReviewForm } from '../AnswerReviewForm'

// The pending interrupt of the mentor run, as the mock serves it: the analysis review.
const mentorRun = buildRun({
  id: runIds.mentorMain3,
  thread_id: threadIds.mentorMain,
  project_id: projectIds.mentor,
  number: 3,
  status: 'interrupted',
  current_stage: 'analysis_review',
})

/** The form holds the answer only: the questions and the options, not the prompt of the review. */
async function formOf(interrupt: Interrupt, run = mentorRun) {
  const view = renderWithProviders(<AnswerReviewForm interrupt={interrupt} run={run} />)
  await waitFor(() => {
    expect(view.container.textContent).not.toBe('')
  })
  return view
}

/** Whether the send of the answer reached the run it answers. */
async function sentAnswer(requests: ReturnType<typeof recordRequests>) {
  await waitFor(() => {
    expect(
      requests.some(
        ({ method, path }) =>
          method === 'POST' && path.includes(`/runs/${runIds.mentorMain3}/resume`),
      ),
    ).toBe(true)
  })
}

describe('AnswerReviewForm', () => {
  it('draws the options as a column, the default one chosen, its feedback inside it', async () => {
    const interrupt = await readPending()
    await formOf(interrupt)

    expect(screen.getByRole('radio', { name: 'Approve analysis' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    expect(screen.getByRole('radio', { name: 'Redo the analysis' })).toHaveAttribute(
      'aria-checked',
      'false',
    )
    // An option that asks for words says so in one line until it is chosen.
    expect(screen.getAllByText('This choice needs a short description from you.')).toHaveLength(2)
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    await expectNoAccessibilityViolations()
  })

  it('sends the default option when nothing else is chosen', async () => {
    const requests = recordRequests()
    const interrupt = await readPending()
    await formOf(interrupt)

    await pressButton('Send')

    await sentAnswer(requests)
  })

  it('puts the writer straight into the feedback of the option it chooses', async () => {
    const requests = recordRequests()
    const interrupt = await readPending()
    await formOf(interrupt)

    await userEvent.click(screen.getByRole('radio', { name: 'Redo the analysis' }))

    const box = await screen.findByRole('textbox', { name: 'Feedback for "Redo the analysis"' })
    expect(box).toHaveFocus()
    expect(box).toHaveAttribute(
      'placeholder',
      'Describe what should change; the agents read this before they continue.',
    )
    await typeText(box, 'Ask the student and the admin whether a layered design works.')
    await pressKeys('{Control>}{enter}{/Control}')

    await sentAnswer(requests)
  })

  it('asks for the feedback when the chosen option needs it and it stays blank', async () => {
    const requests = recordRequests()
    const interrupt = await readPending()
    await formOf(interrupt)

    await userEvent.click(screen.getByRole('radio', { name: 'Interview again' }))
    await pressButton('Send')

    expect(await screen.findByText('Write the feedback.')).toBeInTheDocument()
    expect(requests.some(({ method }) => method === 'POST')).toBe(false)
  })

  it('walks the questions one at a time and sends their answers', async () => {
    const requests = recordRequests()
    const interrupt = await readPending('?mock-agent-questions=only')
    await formOf(interrupt)

    // One question at a time: the first shows, the second waits behind it.
    expect(screen.getByText('Students')).toBeInTheDocument()
    expect(screen.getByText('1 / 4')).toBeInTheDocument()

    await pressButton('Next step')
    expect(screen.queryByText('Students')).not.toBeInTheDocument()
    await pressButton('Next step')
    await pressButton('Next step')
    expect(screen.getByText('4 / 4')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Next step' })).toBeDisabled()

    await pressButton('Send answers')

    await sentAnswer(requests)
  })

  it('keeps the values and shows the reason when the send fails', async () => {
    const toasts = spyOnToast('error')
    server.use(
      http.post(apiEndpoints.runResume.pattern, () =>
        Response.json({ error: 'no' }, { status: HttpStatus.InternalServerError }),
      ),
    )
    const interrupt = await readPending()
    await formOf(interrupt)

    await userEvent.click(screen.getByRole('radio', { name: 'Redo the analysis' }))
    const box = screen.getByRole('textbox', { name: 'Feedback for "Redo the analysis"' })
    await typeText(box, 'Ask the student and the admin whether a layered design works.')
    await pressButton('Send')

    await waitFor(() => {
      expect(toasts).toHaveBeenCalledOnce()
    })
    expect(toasts.mock.calls[0]?.[0]).toMatch(/^The answer was not sent\./)
    expect(box).toHaveValue('Ask the student and the admin whether a layered design works.')
  })
})

/** Reads the pending interrupt of the mentor run from the mock, in the scenario of the address. */
async function readPending(scenario = ''): Promise<Interrupt> {
  const { getApiItems, openPage } = await import('@/test/msw')
  if (scenario !== '') {
    openPage(`/${scenario}`)
  }
  const [interrupt] = await getApiItems<Interrupt>(
    `${apiEndpoints.runInterrupts.path({ runId: runIds.mentorMain3 })}?status=pending&limit=1`,
  )
  if (interrupt === undefined) throw new Error('No pending interrupt in the mock')
  return interrupt
}
