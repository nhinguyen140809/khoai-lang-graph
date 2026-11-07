import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { buildThread } from '@/mocks/threads/threads.fixtures'
import type { Thread } from '@/modules/thread/entities'
import { renderWithProviders } from '@/test/render'
import { expectDisabled, expectEnabled } from '@/test/steps'

import { ChooseRunSettingsButton } from '../ChooseRunSettingsButton'

const idle: Thread = buildThread({ id: 't1', project_id: 'p1', active_run_id: null })
const busy: Thread = buildThread({ id: 't1', project_id: 'p1', active_run_id: 'r1' })

function buttonOf(thread: Thread | null) {
  renderWithProviders(<ChooseRunSettingsButton thread={thread} />)
}

describe('ChooseRunSettingsButton', () => {
  it('opens the dialog of the run settings of the thread', async () => {
    buttonOf(idle)

    await userEvent.click(screen.getByRole('button', { name: 'Run settings' }))
  })

  it('is enabled for a thread without an unfinished run', () => {
    buttonOf(idle)

    expectEnabled('button', 'Run settings')
  })

  it('is disabled with its reason while a run is unfinished', async () => {
    const user = userEvent.setup()
    buttonOf(busy)

    expectDisabled('button', 'Run settings')
    await user.hover(
      screen.getByRole('button', { name: 'Run settings' }).parentElement ?? document.body,
    )
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'The work is in progress. A message joins it, and its settings stay the same.',
    )
  })
})
