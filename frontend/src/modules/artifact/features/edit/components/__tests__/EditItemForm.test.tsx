import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '@/test/render'
import { expectNoAccessibilityViolations, replaceText, typeText } from '@/test/steps'

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
    const user = userEvent.setup()
    renderEditItemForm()

    const title = await screen.findByRole('textbox', { name: 'Title' })
    await replaceText(title, '   ')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Enter a value.')).toBeInTheDocument()
  })

  it('focuses its first field on open, keeps Save disabled until a change, and tells the page of the first change once', async () => {
    const onFirstChange = vi.fn()
    renderEditItemForm({ onFirstChange })

    const title = await screen.findByRole('textbox', { name: 'Title' })
    expect(title).toHaveFocus()
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()

    await typeText(title, ' fast')
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
    expect(onFirstChange).toHaveBeenCalledOnce()
  })

  it('saves the fields that changed, and returns to reading', async () => {
    const user = userEvent.setup()
    const onChanged = vi.fn()
    useEditingRecordStore.getState().startEditing({ type: 'item', id: editableItem.id })
    renderEditItemForm({ onChanged })

    const title = await screen.findByRole('textbox', { name: 'Title' })
    await typeText(title, ' fast')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(onChanged).toHaveBeenCalledOnce()
    })
    expect(useEditingRecordStore.getState().recordKey).toBeNull()
  })

  it('ends the edit mode on a clean Cancel, and asks before a dirty one', async () => {
    const user = userEvent.setup()
    useEditingRecordStore.getState().startEditing({ type: 'item', id: editableItem.id })
    renderEditItemForm()

    await user.click(await screen.findByRole('button', { name: 'Cancel' }))
    expect(useEditingRecordStore.getState().recordKey).toBeNull()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()

    useEditingRecordStore.getState().startEditing({ type: 'item', id: editableItem.id })
    const title = await screen.findByRole('textbox', { name: 'Title' })
    await typeText(title, ' fast')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    // The dialog itself is mounted by DocumentDialogs; the form only opens it through its store.
    await waitFor(() => {
      expect(useDiscardChangesDialogStore.getState().open).toBe(true)
      expect(useDiscardChangesDialogStore.getState().targetId).toBe(`item:${editableItem.id}`)
    })
  })

  it('shows the reason of a lock beside a Save that it disables, and the alert above', async () => {
    renderEditItemForm({ lockedReason: 'Documents cannot change while the agents work.' })

    await screen.findByRole('textbox', { name: 'Title' })
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    expect(screen.getByText('Documents cannot change while the agents work.')).toBeInTheDocument()
  })

  it('has no accessibility violation', async () => {
    const { container } = renderEditItemForm()
    await screen.findByRole('textbox', { name: 'Title' })

    await expectNoAccessibilityViolations(container)
  })
})
