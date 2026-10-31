import { screen } from '@testing-library/react'
import { createElement } from 'react'
import { describe, expect, it } from 'vitest'

import type { Run } from '@/modules/run/entities'
import { renderWorkbench } from '@/test/render'
import { expectRole, findConfirmDialog, openCommandPalette, pressRole } from '@/test/steps'

import { runWith } from '../../__tests__/stop-run.utils.data'
import { StopRunDialog } from '../../components/StopRunDialog'
import { useStopRunCommand } from '../useStopRunCommand'

/** Registers the command of the run it is given, as the status of a project does. */
function commandOf(run: Run | null) {
  return function RunCommand() {
    useStopRunCommand(run)
    return null
  }
}

/** The frame, whose palette lists the commands, with the command and the Stop dialog. */
function renderFrame(run: Run | null) {
  renderWorkbench([
    createElement(commandOf(run), { key: 'command' }),
    createElement(StopRunDialog, { key: 'dialog' }),
  ])
}

describe('useStopRunCommand', () => {
  it('offers Stop run in the palette while the run has not finished', async () => {
    renderFrame(runWith('interrupted'))
    await openCommandPalette()

    await expectRole('option', /Stop run/)
  })

  it.each([
    { name: 'a run that is done', run: runWith('succeeded') },
    { name: 'a run that failed', run: runWith('failed') },
    { name: 'no run', run: null },
  ])('offers nothing for $name', async ({ run }) => {
    renderFrame(run)
    await openCommandPalette()

    await expectRole('dialog', /Command palette/)
    expect(screen.queryByRole('option', { name: /Stop run/ })).not.toBeInTheDocument()
  })

  it('opens the Stop dialog when the command runs', async () => {
    renderFrame(runWith('running'))
    await openCommandPalette()

    await pressRole('option', /Stop run/)

    await findConfirmDialog('Stop the run?')
  })
})
