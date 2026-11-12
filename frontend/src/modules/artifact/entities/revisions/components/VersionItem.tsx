'use client'

import { cn } from 'cn'
import { MoreVerticalIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { useWorkflowDefinition } from '@/modules/workflow/entities/@x/artifact'
import { Button } from '@/shared/components/ui/button'
import { ColoredText } from '@/shared/components/ui/colored-text'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { Toggle, toggleVariants } from '@/shared/components/ui/toggle'
import { formatDateTime } from '@/shared/lib/time'
import { useView } from '@/shared/lib/view'

import {
  changeReasonLabels,
  changeReasonLooks,
  revisionMessages,
} from '../../revisions/revisions.constants'
import type { Revision } from '../../revisions/revisions.types'
import { revisionAuthor } from '../../revisions/revisions.utils'

interface VersionItemProps {
  /** The version to show, from the history of the record. */
  revision: Revision
  /** Whether this version is the one selected now. */
  isSelected: boolean
  /** Selects this version; the list passes it, the stepper shows the selected one without it. */
  onSelect?: (() => void) | undefined
  /** The entries of the menu at the corner of the item, such as the restore of the version. */
  menu?: ReactNode | undefined
  className?: string | undefined
}

/**
 * One version of a record, as the list and the stepper show the same item: who made it and when
 * at the two ends of the first line, the reason in its color under it, and the number of the
 * version, which says the least, at the bottom, where the menu of the item sits at the right.
 * The item is the outline Toggle of the design system, so both of its states carry the border
 * and keep one size, and the selected one holds the fill the toggle takes when pressed.
 */
export function VersionItem({ revision, isSelected, onSelect, menu, className }: VersionItemProps) {
  const { data: definition } = useWorkflowDefinition()
  const viewOfApp = useView()

  const content = (
    <div className="w-full space-y-0.5">
      <p className="flex items-baseline justify-between gap-2">
        <span className="font-medium">
          {revisionMessages.byAuthor(revisionAuthor(revision.changed_by, definition))}
        </span>
        <time dateTime={revision.created_at} className="text-xs text-muted-foreground">
          {formatDateTime(revision.created_at)}
        </time>
      </p>
      <p className="text-xs">
        <ColoredText
          color={changeReasonLooks[revision.change_reason].color}
          className="font-medium"
        >
          {changeReasonLabels[revision.change_reason][viewOfApp]}
        </ColoredText>
      </p>
      <p className="text-xs text-muted-foreground">{revisionMessages.version(revision.version)}</p>
    </div>
  )

  // Both states of the item take the shape of the Toggle: as tall as its lines, open to wrap, and
  // read from the left, in the size the history reads in.
  const item =
    onSelect === undefined ? (
      <div
        className={cn(
          toggleVariants({ variant: 'outline' }),
          'h-auto w-full justify-start bg-muted px-4 py-2.5 text-left text-sm font-normal whitespace-normal',
        )}
        aria-current={isSelected ? 'true' : undefined}
      >
        {content}
      </div>
    ) : (
      <Toggle
        variant="outline"
        pressed={isSelected}
        onPressedChange={() => {
          onSelect()
        }}
        className="h-auto w-full justify-start px-4 py-2.5 text-left text-sm font-normal whitespace-normal"
        aria-current={isSelected ? 'true' : undefined}
      >
        {content}
      </Toggle>
    )

  return (
    <div className={cn('relative', className)}>
      {item}
      {menu !== undefined && (
        <div className="absolute right-1.5 bottom-1.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="text-muted-foreground"
              >
                <MoreVerticalIcon aria-hidden />
                <span className="sr-only">{revisionMessages.moreActions}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {menu}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  )
}
