import { waitFor } from '@testing-library/react'
import { UnlinkIcon } from 'lucide-react'
import { describe, expect, it } from 'vitest'

import { traceLinkFixtures } from '@/mocks/trace/fixtures/trace-links.fixtures'
import { linkKeyOf } from '@/modules/trace/entities'
import { assertPresent } from '@/shared/lib/guards'
import { renderHookWithProviders } from '@/test/render'

import { removeLinkMessages } from '../../remove-link.constants'
import { useRemoveLinkDialogStore } from '../../remove-link.store'
import { useRemoveLinkAction } from '../useRemoveLinkAction'

/** A link of the fixtures, named by its item and its id. */
const link = assertPresent(traceLinkFixtures[0], 'The fixtures hold a trace link')

describe('useRemoveLinkAction', () => {
  it('gives the words, the icon and the destructive look of the action for a menu', () => {
    const { result } = renderHookWithProviders(() =>
      useRemoveLinkAction(link, 'Only the documents under review can change now.'),
    )

    expect(result.current).toMatchObject({
      icon: UnlinkIcon,
      label: removeLinkMessages.open,
      disabledReason: 'Only the documents under review can change now.',
      tone: 'destructive',
    })
  })

  it('runs by opening the dialog of the link, named by its item and its id', async () => {
    const { result } = renderHookWithProviders(() => useRemoveLinkAction(link, null))

    result.current.run()

    await waitFor(() => {
      expect(useRemoveLinkDialogStore.getState().targetId).toBe(
        linkKeyOf(link.source_item_id, link.id),
      )
      expect(useRemoveLinkDialogStore.getState().open).toBe(true)
    })
  })
})
