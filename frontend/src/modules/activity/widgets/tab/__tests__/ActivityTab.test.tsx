import { describe, expect, it } from 'vitest'

import { type ChatReference, useReferenceOpener } from '@/modules/activity/entities'
import { routerMock } from '@/test/next-stubs'
import { renderWithProviders } from '@/test/render'
import { pressButton } from '@/test/steps'

import { ActivityTab } from '../ActivityTab'
import { referenceCases } from './ActivityTab.data'

// A part of the chat that opens one reference, as a card of a message does.
function OpenReferenceButton({ reference }: { reference: ChatReference }) {
  const open = useReferenceOpener(reference)
  return (
    <button type="button" onClick={() => open?.()}>
      Open
    </button>
  )
}

describe('ActivityTab', () => {
  it.each(referenceCases)('opens $name of the chat as a page', async ({ reference, href }) => {
    renderWithProviders(
      <ActivityTab projectId="p1">
        <OpenReferenceButton reference={reference} />
      </ActivityTab>,
    )

    await pressButton('Open')

    expect(routerMock.push).toHaveBeenCalledExactlyOnceWith(href)
  })
})
