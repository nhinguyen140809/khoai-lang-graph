import { waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { itemFixtureByKey } from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '@/mocks/shared/db'
import { renderHookWithProviders } from '@/test/render'
import { itToastsOnResult } from '@/test/suites'

import { editItemFormSchema } from '../../schemas/edit-item.schema'
import { useEditingRecordStore } from '../../stores/editing-record.store'
import { useUpdateItem } from '../useUpdateItem'

const item = itemFixtureByKey(projectIds.mentor, 'AR-001')

/** A form state that a save can show its problems at. */
function errorSetter() {
  return vi.fn()
}

describe('useUpdateItem', () => {
  it('sends the changed fields with If-Match, updates the cache and reloads, and ends the edit mode', async () => {
    const onChanged = vi.fn()
    useEditingRecordStore.getState().startEditing({ type: 'item', id: item.id })
    const { result } = renderHookWithProviders(() =>
      useUpdateItem(item, {
        setError: errorSetter(),
        schema: editItemFormSchema([]),
        onChanged,
      }),
    )

    result.current.mutate({ content: { title: 'List mentors fast' } })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    await waitFor(() => {
      expect(onChanged).toHaveBeenCalledOnce()
    })
    expect(useEditingRecordStore.getState().recordKey).toBeNull()
  })

  itToastsOnResult([
    {
      name: 'the saved item',
      start: async () => {
        const { result } = renderHookWithProviders(() =>
          useUpdateItem(item, {
            setError: errorSetter(),
            schema: editItemFormSchema([]),
            onChanged: () => undefined,
          }),
        )
        result.current.mutate({ content: { title: 'List mentors fast' } })
        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true)
        })
      },
      kind: 'success',
      message: 'Saved',
    },
  ])
})
