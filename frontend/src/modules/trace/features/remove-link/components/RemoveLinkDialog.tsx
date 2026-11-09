'use client'

import { useItem } from '@/modules/artifact/entities'
import { linkSentence, parseLinkKey, useItemLinks } from '@/modules/trace/entities'
import { useItemTitleOf, useLinkTitleOf } from '@/modules/workflow/entities'
import { ConfirmDialog } from '@/shared/components/ui/confirm-dialog'

import { useRemoveLink } from '../hooks/useRemoveLink'
import { removeLinkMessages } from '../remove-link.constants'

interface RemoveLinkDialogProps {
  /** The key of `linkKeyOf`, which names the item and the link. */
  linkKey: string
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Runs once the dialog has closed, after its animation. */
  onClosed?: () => void
}

/**
 * Removes a link, from the menu of an edge of a chain or from the card of an outgoing chip, which
 * open it through `TraceDialogs`. It asks first and says what the link will no longer say.
 */
export function RemoveLinkDialog({ linkKey, open, onOpenChange, onClosed }: RemoveLinkDialogProps) {
  const { sourceItemId, linkId } = parseLinkKey(linkKey)
  const source = useItem(sourceItemId)
  const links = useItemLinks(sourceItemId)
  const titleOf = useItemTitleOf()
  const linkTitleOf = useLinkTitleOf()
  const remove = useRemoveLink(() => {
    onOpenChange(false)
  })

  if (source.data === undefined || links.state !== 'success') return null
  const row = links.rowsByLinkId.get(linkId)
  if (row === undefined) return null

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      onClosed={onClosed}
      destructive
      title={removeLinkMessages.title}
      description={removeLinkMessages.description(
        linkSentence(
          titleOf(source.data),
          { key: row.link.link_type, title: linkTitleOf(row.link.link_type) },
          row.title,
          { tense: 'noLonger' },
        ),
      )}
      confirmLabel={removeLinkMessages.remove}
      onConfirm={() => remove.mutateAsync(row.link.id)}
    />
  )
}
