import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { itemFixtureByKey } from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '@/mocks/shared/db'
import {
  useDiscardChangesDialogStore,
  useEditingRecordStore,
} from '@/modules/artifact/features/edit'
import { useRestoreVersionDialogStore } from '@/modules/artifact/features/restore'
import { renderWithProviders } from '@/test/render'

import { DocumentDialogs } from '../DocumentDialogs'

const item = itemFixtureByKey(projectIds.mentor, 'AR-007')

describe('DocumentDialogs', () => {
  it('mounts the discard dialog, which ends the edit mode on Discard', async () => {
    const user = userEvent.setup()
    renderWithProviders(<DocumentDialogs />)

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()

    useEditingRecordStore.getState().startEditing({ type: 'item', id: item.id })
    act(() => {
      useDiscardChangesDialogStore.getState().openDialog(`item:${item.id}`)
    })

    expect(await screen.findByRole('alertdialog')).toHaveTextContent('Discard your changes?')

    await user.click(screen.getByRole('button', { name: 'Discard' }))
    expect(useEditingRecordStore.getState().recordKey).toBeNull()
  })

  it('mounts the restore dialog, which restores the version of its key', async () => {
    const user = userEvent.setup()
    renderWithProviders(<DocumentDialogs />)

    act(() => {
      useRestoreVersionDialogStore.getState().openDialog(`item:${item.id}@1`)
    })

    expect(await screen.findByRole('alertdialog')).toHaveTextContent('Restore version 1?')

    await user.click(screen.getByRole('button', { name: 'Restore' }))
    await act(async () => {
      await Promise.resolve()
    })
    expect(useRestoreVersionDialogStore.getState().open).toBe(false)
  })
})
