import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { itemFixtureByKey } from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '@/mocks/shared/db'
import { renderWithProviders } from '@/test/render'

import { useRestoreVersionDialogStore } from '../../restore-version-dialog.store'
import { RestoreVersionButton } from '../RestoreVersionButton'

const item = itemFixtureByKey(projectIds.mentor, 'AR-007')
const target = { type: 'item' as const, id: item.id }

function renderButton(lockedReason: string | null = null) {
  return renderWithProviders(
    <RestoreVersionButton target={target} version={1} lockedReason={lockedReason} />,
  )
}

describe('RestoreVersionButton', () => {
  it('opens the dialog of the version through its store', async () => {
    const user = userEvent.setup()
    renderButton()

    await user.click(screen.getByRole('button', { name: 'Restore this version' }))

    expect(useRestoreVersionDialogStore.getState().open).toBe(true)
    expect(useRestoreVersionDialogStore.getState().targetId).toBe(`item:${item.id}@1`)
  })

  it('is disabled with its reason in the tooltip of its wrapper while the record cannot change', async () => {
    const user = userEvent.setup()
    renderButton('A document can change while it waits for your review.')

    const button = screen.getByRole('button', { name: 'Restore this version' })
    expect(button).toBeDisabled()
    await user.hover(assertWrapper(button))
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'A document can change while it waits for your review.',
    )
  })
})

/** The wrapper that carries the tooltip of the disabled button. */
function assertWrapper(button: HTMLElement) {
  const wrapper = button.closest('span')
  if (wrapper === null) throw new Error('The restore button has no wrapper')
  return wrapper
}
