import { waitFor } from '@testing-library/react'
import { Link2Icon } from 'lucide-react'
import { describe, expect, it } from 'vitest'

import { itemFixtureByKey } from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '@/mocks/shared/db'
import { renderHookWithProviders } from '@/test/render'

import { addLinkMessages } from '../../add-link.constants'
import { useAddLinkDialogStore } from '../../add-link.store'
import { useAddLinkAction } from '../useAddLinkAction'

const projectId = projectIds.mentor

describe('useAddLinkAction', () => {
  it('gives the words, the icon and the reason of the action for a menu', async () => {
    const source = itemFixtureByKey(projectId, 'AR-003')
    const { result } = renderHookWithProviders(() =>
      useAddLinkAction(source, 'Only the documents under review can change now.'),
    )

    await waitFor(() => {
      expect(result.current).not.toBeNull()
    })
    expect(result.current).toMatchObject({
      icon: Link2Icon,
      label: addLinkMessages.open,
      disabledReason: 'Only the documents under review can change now.',
    })
  })

  it('runs by opening the dialog of the item', async () => {
    const source = itemFixtureByKey(projectId, 'AR-003')
    const { result } = renderHookWithProviders(() => useAddLinkAction(source, null))

    await waitFor(() => {
      expect(result.current).not.toBeNull()
    })
    result.current?.run()

    await waitFor(() => {
      expect(useAddLinkDialogStore.getState().targetId).toBe(source.id)
      expect(useAddLinkDialogStore.getState().open).toBe(true)
    })
  })

  it('gives null for a kind of item from which no type of link starts, so the menu leaves it out', () => {
    const persona = itemFixtureByKey(projectId, 'PER-001')
    const { result } = renderHookWithProviders(() => useAddLinkAction(persona, null))

    expect(result.current).toBeNull()
  })
})
