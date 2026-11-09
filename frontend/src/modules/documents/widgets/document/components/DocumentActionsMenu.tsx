'use client'

import { MoreHorizontalIcon } from 'lucide-react'
import { useRef } from 'react'

import { useEditRecordAction, useFocusOnEditEnd } from '@/modules/artifact/features/edit'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { DropdownActionItem } from '@/shared/components/ui/menu-action'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'

import { documentActionsMessages } from '../document-page.constants'

/**
 * The menu of the actions of a document, on one icon button beside its title: Edit, with the
 * reason the document cannot change. When the edit mode of the document ends, the button takes
 * the focus back.
 */
export function DocumentActionsMenu({
  target,
  lockedReason,
}: {
  target: { type: 'artifact'; id: string }
  lockedReason: string | null
}) {
  const edit = useEditRecordAction(target, lockedReason)
  const button = useRef<HTMLButtonElement>(null)
  useFocusOnEditEnd(`${target.type}:${target.id}`, button)

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button ref={button} variant="ghost" size="icon-sm" className="text-muted-foreground">
              <MoreHorizontalIcon aria-hidden />
              <span className="sr-only">{documentActionsMessages.more}</span>
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>{documentActionsMessages.more}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownActionItem
          icon={edit.icon}
          label={edit.label}
          disabledReason={edit.disabledReason}
          onSelect={edit.run}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
