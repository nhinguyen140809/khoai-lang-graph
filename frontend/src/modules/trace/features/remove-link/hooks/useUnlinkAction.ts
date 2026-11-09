'use client'

import { Unlink2Icon } from 'lucide-react'

import { linkKeyOf, type TraceLink } from '@/modules/trace/entities'
import type { MenuAction } from '@/shared/components/ui/menu-action'

import { removeLinkMessages } from '../remove-link.constants'
import { useOpenRemoveLinkDialog } from './useOpenRemoveLinkDialog'

/**
 * The action of removing a link, for a menu: the words and the icon of the action in the
 * destructive look, the reason its document cannot change, and a run that opens the Remove link
 * dialog, which asks before it sends.
 */
export function useUnlinkAction(
  link: Pick<TraceLink, 'id' | 'source_item_id'>,
  lockedReason: string | null,
): MenuAction {
  const openRemoveLink = useOpenRemoveLinkDialog()

  return {
    icon: Unlink2Icon,
    label: removeLinkMessages.open,
    disabledReason: lockedReason,
    tone: 'destructive',
    run: () => {
      openRemoveLink(linkKeyOf(link.source_item_id, link.id))
    },
  }
}
