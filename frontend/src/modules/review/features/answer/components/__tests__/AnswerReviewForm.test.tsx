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
import { assertPresent } from '@/shared/lib/guards'
import { recordRequests } from '@/test/msw'
import { renderWithProviders } from '@/test/render'
import {
  expectAttribute,
  expectDisabled,
  expectNoAccessibilityViolations,
  expectNoRole,
  expectNoText,
  expectText,
  pressButton,
  pressKeys,
  pressRole,
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

    expectAttribute('radio', 'Approve analysis', 'aria-checked', 'true')
    expectAttribute('radio', 'Redo the analysis', 'aria-checked', 'false')
    // Each option says what choosing it does, chosen or not, and the one that is described to the
    // radio by its words.
    await expectText('The analysis goes on to the specification.')
    expect(
      screen.getByText('The analysis is written again, settling the open conflicts.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Redo the analysis' })).toHaveAccessibleDescription(
      'The analysis is written again, settling the open conflicts.',
    )
    expectNoRole('textbox')
    await expectNoAccessibilityViolations()
  })

  it('says that an option asks for words, until it is chosen, when the agent described none', async () => {
    const interrupt = await readPending()
    const undescribed = {
      ...interrupt,
      options: interrupt.options.map((option) => ({ ...option, description: undefined })),
    }
    await formOf(undescribed)

    expect(screen.getAllByText('This choice needs a short description from you.')).toHaveLength(2)
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

    await pressRole('radio', 'Redo the analysis')

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

  it('fills the feedback with what the agent suggests for the chosen option, which can be changed', async () => {
    const interrupt = await readPending()
    await formOf(interrupt)

    await pressRole('radio', 'Interview again')
    const box = screen.getByRole('textbox', { name: 'Feedback for "Interview again"' })
    expect(box).toHaveValue('Interview the mentors again about how they approve a session.')

    await pressRole('radio', 'Redo the analysis')
    expect(screen.getByRole('textbox', { name: 'Feedback for "Redo the analysis"' })).toHaveValue(
      'Settle the two open conflicts in favour of the students, then redo the analysis.',
    )
  })

  it('asks for the feedback when the chosen option needs it and it stays blank', async () => {
    const requests = recordRequests()
    const interrupt = await readPending()
    await formOf(interrupt)

    await pressRole('radio', 'Interview again')
    await userEvent.clear(screen.getByRole('textbox', { name: 'Feedback for "Interview again"' }))
    await pressButton('Send')

    await expectText('Write the feedback.')
    expect(requests.some(({ method }) => method === 'POST')).toBe(false)
  })

  it('walks the questions one at a time and sends their answers', async () => {
    const requests = recordRequests()
    const interrupt = await readPending('?mock-agent-questions=only')
    await formOf(interrupt)

    // One question at a time: the first shows, the second waits behind it.
    await expectText('Students')
    await expectText('1 / 4')

    await pressButton('Next step')
    // The first question slides out as the second slides in, and is gone once it has.
    await waitFor(() => {
      expectNoText('Students')
    })
    await pressButton('Next step')
    await pressButton('Next step')
    await expectText('4 / 4')
    expectDisabled('button', 'Next step')

    await pressButton('Send answers')

    await sentAnswer(requests)
  })

  it('moves between the questions with the left and right keys, and takes the focus along', async () => {
    const interrupt = await readPending('?mock-agent-questions=only')
    await formOf(interrupt)
    const first = screen.getAllByRole('checkbox')[0]
    assertPresent(first, 'The first question holds choices').focus()

    await pressKeys('{ArrowRight}')

    await expectText('2 / 4')
    await pressKeys('{ArrowLeft}')
    await expectText('1 / 4')
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

    await pressRole('radio', 'Redo the analysis')
    const box = screen.getByRole('textbox', { name: 'Feedback for "Redo the analysis"' })
    await userEvent.clear(box)
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
