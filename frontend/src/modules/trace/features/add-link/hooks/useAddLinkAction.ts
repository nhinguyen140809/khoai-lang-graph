'use client'

import { Link2Icon } from 'lucide-react'

import type { ArtifactItem } from '@/modules/artifact/entities'
import { linkTypesFrom, useWorkflowDefinition } from '@/modules/workflow/entities'
import type { MenuAction } from '@/shared/components/ui/menu-action'

import { addLinkMessages } from '../add-link.constants'
import { useOpenAddLinkDialog } from './useOpenAddLinkDialog'

/**
 * The action of linking an item to another, for a menu: the words and the icon of the action, the
 * reason its document cannot change, and a run that opens the Add link dialog. It gives null for
 * a kind of item from which no type of link starts, so that the menu leaves the item out.
 */
export function useAddLinkAction(
  source: Pick<ArtifactItem, 'id' | 'kind'>,
  lockedReason: string | null,
): MenuAction | null {
  const { data: definition } = useWorkflowDefinition()
  const openAddLink = useOpenAddLinkDialog()

  if (definition === undefined) return null
  if (linkTypesFrom(definition, source.kind).length === 0) return null
  return {
    icon: Link2Icon,
    label: addLinkMessages.open,
    disabledReason: lockedReason,
    run: () => {
      openAddLink(source.id)
    },
  }
}
