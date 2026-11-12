import { waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { buildStep } from '@/mocks/runs/fixtures/runs.fixtures'
import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpStatus } from '@/shared/api/http'
import { recordRequests } from '@/test/msw'
import { renderWithProviders } from '@/test/render'
import { expectNoRole, pressButton, spyOnToast, waitForCall } from '@/test/steps'

import { runWith } from '../../__tests__/retry-run.utils.data'
import { retryRunMessages } from '../../retry-run.constants'
import { RetryRunButton } from '../RetryRunButton'

/** The thread has no run newer than the one that failed: it is the latest. */
function useLatest(...runs: ReturnType<typeof runWith>[]) {
  server.use(
    http.get(apiEndpoints.threadRuns.pattern, () =>
      HttpResponse.json({ items: runs, next_cursor: null }),
    ),
  )
}

const failed = [buildStep({ sequence: 1 }), buildStep({ id: 's2', sequence: 2, status: 'failed' })]

describe('RetryRunButton', () => {
  it('starts a new run from the step that failed, and says so', async () => {
    useLatest(runWith('failed'))
    server.use(
      http.post(apiEndpoints.runRetry.pattern, () =>
        HttpResponse.json(runWith('queued'), { status: HttpStatus.Accepted }),
      ),
    )
    const requests = recordRequests()
    const success = spyOnToast('success')
    renderWithProviders(<RetryRunButton run={runWith('failed')} steps={failed} />)

    await pressButton(retryRunMessages.label)

    await waitForCall(success, retryRunMessages.started)
    const sent = requests.find(({ method }) => method === 'POST')
    expect(sent?.path).toMatch(/\/runs\/r1\/retry$/)
    expect(sent?.body).toEqual({ from_step_id: 's2' })
  })

  it('says that another run works when the thread already has one', async () => {
    useLatest(runWith('failed'))
    server.use(
      http.post(apiEndpoints.runRetry.pattern, () =>
        HttpResponse.json(
          { title: 'Conflict', code: 'run_already_active', detail: 'A run is active.' },
          { status: HttpStatus.Conflict },
        ),
      ),
    )
    const failure = spyOnToast('error')
    renderWithProviders(<RetryRunButton run={runWith('failed')} steps={failed} />)

    await pressButton(retryRunMessages.label)

    await waitForCall(failure, retryRunMessages.alreadyActive)
  })

  it('renders nothing for a run that a newer run of the thread has followed', async () => {
    useLatest({ ...runWith('succeeded'), id: 'r2', number: 2 })
    renderWithProviders(<RetryRunButton run={runWith('failed')} steps={failed} />)

    await waitFor(() => {
      expectNoRole('button', retryRunMessages.label)
    })
  })

  it.each([
    { name: 'a run that works', run: runWith('running'), steps: failed },
    {
      name: 'a phase where nothing failed',
      run: runWith('failed'),
      steps: [buildStep({ sequence: 1 })],
    },
  ])('renders nothing for $name', ({ run, steps }) => {
    renderWithProviders(<RetryRunButton run={run} steps={steps} />)

    expectNoRole('button', retryRunMessages.label)
  })
})
