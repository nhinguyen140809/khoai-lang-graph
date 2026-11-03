import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { assertPresent } from '@/shared/lib/guards'
import { renderWithProviders } from '@/test/render'

import { useEditingRecordStore } from '../../stores/editing-record.store'
import { EditRecordButton } from '../EditRecordButton'

const target = { type: 'item' as const, id: 'item-1' }

function renderButton(lockedReason: string | null = null) {
  return renderWithProviders(<EditRecordButton target={target} lockedReason={lockedReason} />)
}

describe('EditRecordButton', () => {
  it('starts the edit mode of its record', async () => {
    const user = userEvent.setup()
    renderButton()

    await user.click(screen.getByRole('button', { name: 'Edit' }))

    expect(useEditingRecordStore.getState().recordKey).toBe('item:item-1')
  })

  it('is disabled, with its reason in the tooltip of its wrapper', async () => {
    const user = userEvent.setup()
    renderButton('Only the documents under review can change now.')

    const button = screen.getByRole('button', { name: 'Edit' })
    expect(button).toBeDisabled()
    await user.hover(assertWrapper(button))
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'Only the documents under review can change now.',
    )
  })

  it('takes the focus once when the edit mode of its record ends', () => {
    const { unmount } = renderButton()

    act(() => {
      useEditingRecordStore.getState().startEditing(target)
      useEditingRecordStore.getState().stopEditing()
    })

    expect(screen.getByRole('button', { name: 'Edit' })).toHaveFocus()
    expect(useEditingRecordStore.getState().endedKey).toBeNull()
    unmount()
  })
})

/** The wrapper that carries the tooltip of the disabled button. */
function assertWrapper(button: HTMLElement) {
  return assertPresent(button.closest('span'), 'The Edit button has no wrapper')
}
