import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '@/test/render'

import { useEditingRecordStore } from '../../stores/editing-record.store'
import { DiscardChangesDialog } from '../DiscardChangesDialog'

function renderDialog() {
  return renderWithProviders(
    <DiscardChangesDialog open onOpenChange={() => undefined} onClosed={() => undefined} />,
  )
}

describe('DiscardChangesDialog', () => {
  it('keeps the edit mode on Keep editing, and ends it on Discard', async () => {
    const user = userEvent.setup()
    useEditingRecordStore.getState().startEditing({ type: 'item', id: 'item-1' })
    renderDialog()

    const dialog = screen.getByRole('alertdialog')
    await user.click(screen.getByRole('button', { name: 'Keep editing' }))
    expect(useEditingRecordStore.getState().recordKey).toBe('item:item-1')

    await user.click(screen.getByRole('button', { name: 'Discard' }))
    expect(useEditingRecordStore.getState().recordKey).toBeNull()
    expect(dialog).toBeInTheDocument()
  })
})
