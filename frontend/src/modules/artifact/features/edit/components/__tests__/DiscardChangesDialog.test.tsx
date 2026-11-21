import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '@/test/render'
import { pressButton } from '@/test/steps'

import { useEditingRecordStore } from '../../stores/editing-record.store'
import { DiscardChangesDialog } from '../DiscardChangesDialog'

function renderDialog() {
  return renderWithProviders(
    <DiscardChangesDialog open onOpenChange={() => undefined} onClosed={() => undefined} />,
  )
}

describe('DiscardChangesDialog', () => {
  it('keeps the edit mode on Keep editing, and ends it on Discard', async () => {
    useEditingRecordStore.getState().startEditing({ type: 'item', id: 'item-1' })
    renderDialog()

    const dialog = screen.getByRole('alertdialog')
    await pressButton('Keep editing')
    expect(useEditingRecordStore.getState().recordKey).toBe('item:item-1')

    await pressButton('Discard')
    expect(useEditingRecordStore.getState().recordKey).toBeNull()
    expect(dialog).toBeInTheDocument()
  })
})
