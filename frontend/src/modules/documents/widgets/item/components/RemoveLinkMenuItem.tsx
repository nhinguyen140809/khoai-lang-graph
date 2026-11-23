'use client'

import type { TraceLink } from '@/modules/trace/entities'
import { useUnlinkAction } from '@/modules/trace/features/remove-link'
import { DropdownActionItem } from '@/shared/components/ui/menu-action'

/** What the menu of the card of an outgoing chip offers: removing the link, when its document may change. */
export function RemoveLinkMenuItem({
  link,
  lockedReason,
}: {
  link: Pick<TraceLink, 'id' | 'source_item_id'>
  lockedReason: string | null
}) {
  const remove = useUnlinkAction(link, lockedReason)

  return (
    <DropdownActionItem
      icon={remove.icon}
      label={remove.label}
      disabledReason={remove.disabledReason}
      tone={remove.tone}
      onSelect={remove.run}
    />
  )
}
