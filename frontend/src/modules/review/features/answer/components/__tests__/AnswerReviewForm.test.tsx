import { screen, waitFor } from '@testing-library/react'
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
  replaceText,
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
    await expectText('The analysis is written again, settling the open conflicts.')
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

    expect(screen.getAllByText('This choice needs a short description from you.')).toHaveLength(3)
  })

  it('sends the default option when nothing else is chosen', async () => {
    const requests = recordRequests()
    const interrupt = await readPending()
    await formOf(interrupt)

    await pressButton('Send')

    await sentAnswer(requests)
  })

  it('sends the answer on Enter from the options of the last step', async () => {
    const requests = recordRequests()
    const interrupt = await readPending()
    await formOf(interrupt)
    await waitFor(() => {
      expect(screen.getAllByRole('radio')).toContain(document.activeElement)
    })

    await pressKeys('{Enter}')

    await sentAnswer(requests)
  })

  it('shows what a choice does under its title, and the text that Other asks for inside its box', async () => {
    const interrupt = await readPending('?mock-agent-questions=only')
    await formOf(interrupt)

    await expectText('The interviews ask the mentors who run sessions in the rooms.')
    expectNoRole('textbox')
    await pressRole('checkbox', 'Someone else, please specify')

    const box = await screen.findByRole('textbox', { name: /More about your choice/ })
    expect(box.closest('label')).toContainElement(
      screen.getByRole('checkbox', { name: /Someone else, please specify/ }),
    )
    expect(box).toHaveFocus()
  })

  it('chooses the answer that has the focus on Enter, when it is not chosen yet', async () => {
    const interrupt = await readPending('?mock-agent-questions=only')
    await formOf(interrupt)
    await pressButton('Next step')
    await expectText('2 / 4')
    await waitFor(() => {
      expect(screen.getAllByRole('radio')).toContain(document.activeElement)
    })

    const radios = screen.getAllByRole('radio')
    const start = radios.indexOf(document.activeElement as HTMLElement)

    await pressKeys('{ArrowDown}')
    const target = assertPresent(radios[(start + 1) % radios.length], 'The step has radios.')
    expect(target).toHaveFocus()
    expect(target).not.toBeChecked()
    await pressKeys('{Enter}')

    expect(target).toBeChecked()

    // Going on past the last answer comes round to the first, and up from the first to the last.
    await pressKeys('{ArrowDown}'.repeat(radios.length))
    expect(target).toHaveFocus()
    await pressKeys('{ArrowUp}')
    expect(radios.at(radios.indexOf(target) - 1)).toHaveFocus()
  })

  it('does not send on Enter before the last step', async () => {
    const requests = recordRequests()
    const interrupt = await readPending('?mock-agent-questions=only')
    await formOf(interrupt)
    await waitFor(() => {
      expect(screen.getAllByRole('checkbox')).toContain(document.activeElement)
    })

    await pressKeys('{Enter}')

    expect(requests.filter(({ method }) => method === 'POST').map(({ path }) => path)).toEqual([])
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
    await replaceText(screen.getByRole('textbox', { name: 'Feedback for "Interview again"' }), '')
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
    // The second question takes the focus as it slides in, once the first has slid out.
    await waitFor(() => {
      expect(screen.getAllByRole('radio')).toContain(document.activeElement)
    })
    await pressKeys('{ArrowLeft}')
    await expectText('1 / 4')
  })

  it('takes the focus into the first question as it shows, and keeps it when a button moves on', async () => {
    const interrupt = await readPending('?mock-agent-questions=only')
    await formOf(interrupt)

    await waitFor(() => {
      expect(screen.getAllByRole('checkbox')).toContain(document.activeElement)
    })
    await pressButton('Next step')

    await expectText('2 / 4')
    await waitFor(() => {
      expect(screen.getAllByRole('radio')).toContain(document.activeElement)
    })
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
    await replaceText(box, '')
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
