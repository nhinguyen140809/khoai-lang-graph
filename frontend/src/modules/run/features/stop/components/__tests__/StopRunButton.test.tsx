import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '@/test/render'
import { expectNoRole, expectRole, pressButton } from '@/test/steps'

import { runWith } from '../../__tests__/stop-run.utils.data'
import { useStopRunDialog } from '../../hooks/useOpenStopRunDialog'
import { stopRunMessages } from '../../stop-run.constants'
import { StopRunButton } from '../StopRunButton'

// Shows the run that the one dialog of Stop asks about.
function AskedRun() {
  const { targetId, open } = useStopRunDialog()
  return <p>{open && targetId !== null ? `Asking about ${targetId}` : 'Not asking'}</p>
}

describe('StopRunButton', () => {
  it('opens the one Stop dialog for its run', async () => {
    renderWithProviders(
      <>
        <StopRunButton run={runWith('running')} />
        <AskedRun />
      </>,
    )
    await expectRole('button', stopRunMessages.stop)
    expect(document.body).toHaveTextContent('Not asking')

    await pressButton(stopRunMessages.stop)

    expect(document.body).toHaveTextContent('Asking about r1')
  })

  it.each([
    { name: 'no run', run: null },
    { name: 'a run that is done', run: runWith('succeeded') },
    { name: 'a run that was stopped', run: runWith('cancelled') },
  ])('renders nothing for $name', ({ run }) => {
    renderWithProviders(<StopRunButton run={run} />)

    expectNoRole('button', stopRunMessages.stop)
  })
})
