'use client'

import { MoreHorizontalIcon } from 'lucide-react'
import { useRef } from 'react'

import { type ArtifactItem } from '@/modules/artifact/entities'
import { useEditRecordAction, useFocusOnEditEnd } from '@/modules/artifact/features/edit'
import { useProjectId } from '@/modules/project/entities'
import { useAddLinkAction } from '@/modules/trace/features/add-link'
import { useViewTraceAction } from '@/modules/trace/features/view-trace'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { DropdownActionItem } from '@/shared/components/ui/menu-action'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'

import { itemActionsMessages } from '../item-page.constants'

/**
 * The menu of the actions of an item, on one icon button beside its title: Edit, View its trace and
 * Link to another item, each with its icon and the reason it cannot run now. When the edit mode of
 * the item ends, the button takes the focus back.
 */
export function ItemActionsMenu({
  record,
  lockedReason,
}: {
  record: ArtifactItem
  lockedReason: string | null
}) {
  const target = { type: 'item' as const, id: record.id }
  const edit = useEditRecordAction(target, lockedReason)
  const addLink = useAddLinkAction(record, lockedReason)
  const viewTrace = useViewTraceAction(useProjectId())({ id: record.id })
  const button = useRef<HTMLButtonElement>(null)
  useFocusOnEditEnd(`${target.type}:${target.id}`, button)

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button ref={button} variant="ghost" size="icon-sm" className="text-muted-foreground">
              <MoreHorizontalIcon aria-hidden />
              <span className="sr-only">{itemActionsMessages.more}</span>
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>{itemActionsMessages.more}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownActionItem
          icon={edit.icon}
          label={edit.label}
          disabledReason={edit.disabledReason}
          onSelect={edit.run}
        />
        <DropdownActionItem
          icon={viewTrace.icon}
          label={viewTrace.label}
          disabledReason={viewTrace.disabledReason}
          onSelect={viewTrace.run}
        />
        {addLink !== null && (
          <DropdownActionItem
            icon={addLink.icon}
            label={addLink.label}
            disabledReason={addLink.disabledReason}
            onSelect={addLink.run}
          />
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
