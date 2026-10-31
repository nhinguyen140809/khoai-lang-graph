import { waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { projectIds } from '@/mocks/shared/db'
import { renderWorkbench } from '@/test/render'
import { confirmAction, findConfirmDialog, pressButton, statusBar } from '@/test/steps'

import { ProjectRunStatusItem } from '../ProjectRunStatusItem'

/** The frame with the status of the mentor platform contributed to it. */
function renderFrame() {
  return renderWorkbench(<ProjectRunStatusItem projectId={projectIds.mentor} />)
}

describe('ProjectRunStatusItem', () => {
  it('shows the status on the status bar', async () => {
    renderFrame()

    await waitFor(() => {
      expect(within(statusBar()).getByRole('status')).toHaveTextContent(
        'Waiting for you: Reviewing the analysis',
      )
    })
  })

  it('takes the status off the status bar when it leaves', async () => {
    const { rerenderContributions } = renderFrame()
    await within(statusBar()).findByRole('status')

    rerenderContributions(null)

    await waitFor(() => {
      expect(within(statusBar()).queryByRole('status')).not.toBeInTheDocument()
    })
  })

  it('stops the run after asking, then shows it stopped', async () => {
    renderFrame()
    await within(statusBar()).findByRole('button', { name: 'Stop' })

    await pressButton('Stop')
    const dialog = await findConfirmDialog('Stop the run?')
    await confirmAction(dialog, 'Stop run')

    await waitFor(() => {
      expect(within(statusBar()).getByRole('status')).toHaveTextContent('Stopped')
    })
    expect(within(statusBar()).queryByRole('button', { name: 'Stop' })).not.toBeInTheDocument()
  })
})
