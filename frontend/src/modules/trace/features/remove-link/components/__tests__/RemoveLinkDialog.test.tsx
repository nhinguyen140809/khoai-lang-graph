import { http } from 'msw'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { noContent } from '@/mocks/shared/http/response'
import { traceLinkFixtures } from '@/mocks/trace/fixtures/trace-links.fixtures'
import { linkKeyOf } from '@/modules/trace/entities'
import { apiEndpoints } from '@/shared/api/endpoints'
import { assertPresent } from '@/shared/lib/guards'
import { serverError } from '@/test/msw'
import { renderWithProviders } from '@/test/render'
import { findConfirmDialog, pressButton } from '@/test/steps'
import { itAsksBeforeAction, itToastsOnResult } from '@/test/suites'

import { removeLinkMessages } from '../../remove-link.constants'
import { RemoveLinkDialog } from '../RemoveLinkDialog'

/** A link of the fixtures whose source sits in the document under review. */
const link = assertPresent(traceLinkFixtures[0], 'The fixtures hold a trace link')

/** The dialog with its open state, as the layout holds it. */
function Harness({ linkKey }: { linkKey: string }) {
  const [open, setOpen] = useState(true)
  return (
    <RemoveLinkDialog
      linkKey={linkKey}
      open={open}
      onOpenChange={setOpen}
      onClosed={() => undefined}
    />
  )
}

function renderDialog() {
  return renderWithProviders(<Harness linkKey={linkKeyOf(link.source_item_id, link.id)} />)
}

async function askToRemove() {
  renderDialog()
  return findConfirmDialog(removeLinkMessages.title)
}

describe('RemoveLinkDialog', () => {
  let isRemoved = false

  itAsksBeforeAction({
    action: 'removing a link',
    confirmLabel: removeLinkMessages.remove,
    hasRun: () => isRemoved,
    open: () => {
      isRemoved = false
      server.use(
        http.delete(apiEndpoints.traceLink.pattern, () => {
          isRemoved = true
          return noContent()
        }),
      )
      return askToRemove()
    },
    fail: () => {
      server.use(
        http.delete(apiEndpoints.traceLink.pattern, () => {
          isRemoved = true
          return serverError()
        }),
      )
    },
  })

  it('says what the link will no longer say', async () => {
    const dialog = await askToRemove()

    expect(dialog).toHaveTextContent(/will no longer be evidenced by/)
    expect(dialog).toHaveTextContent(
      'The link leaves the graph, the lists and the pages of both items.',
    )
  })

  it('renders nothing for a link that the queries no longer hold', () => {
    renderWithProviders(<Harness linkKey={linkKeyOf(link.source_item_id, 'missing')} />)

    expect(document.querySelector('[role="alertdialog"]')).toBeNull()
  })

  itToastsOnResult([
    {
      name: 'removing a link',
      start: async () => {
        server.use(http.delete(apiEndpoints.traceLink.pattern, () => noContent()))
        await askToRemove()
        await pressButton(removeLinkMessages.remove)
      },
      kind: 'success',
      message: removeLinkMessages.removed,
    },
    {
      name: 'a removal that fails',
      start: async () => {
        server.use(http.delete(apiEndpoints.traceLink.pattern, serverError))
        await askToRemove()
        await pressButton(removeLinkMessages.remove)
      },
      kind: 'error',
      message: 'Failed to remove the link (HTTP 500)',
    },
  ])
})
