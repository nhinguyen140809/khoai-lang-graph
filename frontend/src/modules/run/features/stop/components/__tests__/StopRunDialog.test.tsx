import { http } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { runIds } from '@/mocks/shared/db'
import { accepted } from '@/mocks/shared/http/response'
import { apiEndpoints } from '@/shared/api/endpoints'
import { serverError } from '@/test/msw'
import { renderWithProviders } from '@/test/render'
import {
  expectNoAccessibilityViolations,
  expectNoConfirmDialog,
  findConfirmDialog,
  pressButton,
} from '@/test/steps'
import { itAsksBeforeAction, itToastsOnResult } from '@/test/suites'

import { useOpenStopRunDialog } from '../../hooks/useOpenStopRunDialog'
import { stopRunMessages } from '../../stop-run.constants'
import { StopRunDialog } from '../StopRunDialog'

// Opens the one dialog for a run, as the button and the command of the palette do.
function Opener({ runId }: { runId: string }) {
  const openDialog = useOpenStopRunDialog()
  return (
    <button
      type="button"
      onClick={() => {
        openDialog(runId)
      }}
    >
      {stopRunMessages.stop}
    </button>
  )
}

// Stop opens the one dialog, which the layout of the status holds.
function renderStop() {
  return renderWithProviders(
    <>
      <Opener runId={runIds.mentorMain3} />
      <StopRunDialog />
    </>,
  )
}

async function askToStop() {
  renderStop()
  await pressButton(stopRunMessages.stop)
  return findConfirmDialog(stopRunMessages.title)
}

describe('StopRunDialog', () => {
  let isRequested = false

  itAsksBeforeAction({
    action: 'stopping a run',
    confirmLabel: stopRunMessages.stopRun,
    cancelLabel: stopRunMessages.keep,
    hasRun: () => isRequested,
    open: () => {
      isRequested = false
      server.use(
        http.post(apiEndpoints.runCancel.pattern, () => {
          isRequested = true
          return accepted({})
        }),
      )
      return askToStop()
    },
    fail: () => {
      server.use(
        http.post(apiEndpoints.runCancel.pattern, () => {
          isRequested = true
          return serverError()
        }),
      )
    },
  })

  it('renders nothing before Stop is pressed', async () => {
    renderStop()

    await expectNoConfirmDialog()
  })

  it('names the loss and the way to keep the run', async () => {
    const dialog = await askToStop()

    expect(dialog).toHaveTextContent(stopRunMessages.description)
    expect(dialog).toHaveTextContent(stopRunMessages.keep)
    await expectNoAccessibilityViolations(dialog)
  })

  itToastsOnResult([
    {
      name: 'a run stopped',
      start: async () => {
        await askToStop()
        await pressButton(stopRunMessages.stopRun)
      },
      kind: 'success',
      message: stopRunMessages.stopped,
    },
    {
      name: 'a run that has ended, in the words of the error',
      start: async () => {
        // The mentor run 1 has succeeded: the server answers 409 invalid_state.
        renderWithProviders(
          <>
            <Opener runId={runIds.mentorMain1} />
            <StopRunDialog />
          </>,
        )
        await pressButton(stopRunMessages.stop)
        await findConfirmDialog(stopRunMessages.title)
        await pressButton(stopRunMessages.stopRun)
      },
      kind: 'error',
      message: 'Failed to stop the run (HTTP 409): The run has already ended.',
    },
  ])
})
