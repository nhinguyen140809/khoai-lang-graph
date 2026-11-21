import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '@/test/render'
import {
  expectDisabled,
  expectEnabled,
  expectNoAccessibilityViolations,
  expectNoRole,
  expectRole,
  expectText,
  pressButton,
  replaceText,
  typeText,
} from '@/test/steps'

import { useDiscardChangesDialogStore } from '../../stores/discard-changes-dialog.store'
import { useEditingRecordStore } from '../../stores/editing-record.store'
import { EditItemForm } from '../EditItemForm'
import { editableItem, editableSchema } from './EditItemForm.data'

/** The form of the editable item, with what its page gives it. */
function renderEditItemForm({
  lockedReason = null,
  onChanged = () => undefined,
  onFirstChange = () => undefined,
}: {
  lockedReason?: string | null
  onChanged?: () => void
  onFirstChange?: () => void
} = {}) {
  return renderWithProviders(
    <EditItemForm
      item={editableItem}
      schema={editableSchema}
      lockedReason={lockedReason}
      onChanged={onChanged}
      onFirstChange={onFirstChange}
    />,
  )
}

describe('EditItemForm', () => {
  it('asks for a required field left empty before sending', async () => {
    renderEditItemForm()

    const title = await screen.findByRole('textbox', { name: 'Title' })
    await replaceText(title, '   ')
    await pressButton('Save')

    await expectText('Enter a value.')
  })

  it('focuses its first field on open, keeps Save disabled until a change, and tells the page of the first change once', async () => {
    const onFirstChange = vi.fn()
    renderEditItemForm({ onFirstChange })

    const title = await screen.findByRole('textbox', { name: 'Title' })
    expect(title).toHaveFocus()
    expectDisabled('button', 'Save')

    await typeText(title, ' fast')
    expectEnabled('button', 'Save')
    expect(onFirstChange).toHaveBeenCalledOnce()
  })

  it('saves the fields that changed, and returns to reading', async () => {
    const onChanged = vi.fn()
    useEditingRecordStore.getState().startEditing({ type: 'item', id: editableItem.id })
    renderEditItemForm({ onChanged })

    const title = await screen.findByRole('textbox', { name: 'Title' })
    await typeText(title, ' fast')
    await pressButton('Save')

    await waitFor(() => {
      expect(onChanged).toHaveBeenCalledOnce()
    })
    expect(useEditingRecordStore.getState().recordKey).toBeNull()
  })

  it('ends the edit mode on a clean Cancel, and asks before a dirty one', async () => {
    useEditingRecordStore.getState().startEditing({ type: 'item', id: editableItem.id })
    renderEditItemForm()

    await pressButton('Cancel')
    expect(useEditingRecordStore.getState().recordKey).toBeNull()
    expectNoRole('alertdialog')

    useEditingRecordStore.getState().startEditing({ type: 'item', id: editableItem.id })
    const title = await screen.findByRole('textbox', { name: 'Title' })
    await typeText(title, ' fast')
    await pressButton('Cancel')

    // The dialog itself is mounted by DocumentDialogs; the form only opens it through its store.
    await waitFor(() => {
      expect(useDiscardChangesDialogStore.getState().open).toBe(true)
      expect(useDiscardChangesDialogStore.getState().targetId).toBe(`item:${editableItem.id}`)
    })
  })

  it('shows the reason of a lock beside a Save that it disables, and the alert above', async () => {
    renderEditItemForm({ lockedReason: 'Documents cannot change while the agents work.' })

    await expectRole('textbox', 'Title')
    expectDisabled('button', 'Save')
    await expectText('Documents cannot change while the agents work.')
  })

  it('has no accessibility violation', async () => {
    const { container } = renderEditItemForm()
    await expectRole('textbox', 'Title')

    await expectNoAccessibilityViolations(container)
  })
})
