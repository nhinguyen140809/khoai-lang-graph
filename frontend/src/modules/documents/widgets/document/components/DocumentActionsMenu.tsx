'use client'

import { FileDownIcon, FileTextIcon, MoreHorizontalIcon } from 'lucide-react'
import { useRef } from 'react'
import { toast } from 'sonner'

import { useDownloadExport } from '@/modules/artifact/entities'
import { useEditRecordAction, useFocusOnEditEnd } from '@/modules/artifact/features/edit'
import { errorMessageOf } from '@/shared/api/error'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { DropdownActionItem } from '@/shared/components/ui/menu-action'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'

import { documentActionsMessages } from '../document-page.constants'

/** The kinds of document that a project can download, and the export template that builds it. */
const exportTemplateByKind: Readonly<Record<string, string>> = {
  requirement_specification: 'requirement_specification',
  product_backlog: 'product_backlog',
}

/**
 * The menu of the actions of a document, on one icon button beside its title: Edit, with the
 * reason the document cannot change. When the edit mode of the document ends, the button takes
 * the focus back.
 */
export function DocumentActionsMenu({
  projectId,
  kind,
  target,
  lockedReason,
}: {
  projectId: string
  kind: string
  target: { type: 'artifact'; id: string }
  lockedReason: string | null
}) {
  const edit = useEditRecordAction(target, lockedReason)
  const { download, pending } = useDownloadExport(projectId)
  const button = useRef<HTMLButtonElement>(null)
  useFocusOnEditEnd(`${target.type}:${target.id}`, button)
  const template = exportTemplateByKind[kind]
  const preparing = pending === null ? null : documentActionsMessages.preparing

  function run(format: 'txt' | 'pdf') {
    return () => {
      if (template === undefined) return
      void download(template, format).catch((error: unknown) => {
        toast.error(errorMessageOf(error instanceof Error ? error : new Error(String(error)), {}))
      })
    }
  }

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
      <DropdownMenuContent align="end" className="w-48">
        <DropdownActionItem
          icon={edit.icon}
          label={edit.label}
          disabledReason={edit.disabledReason}
          onSelect={edit.run}
        />
        {template === undefined ? null : (
          <>
            <DropdownActionItem
              icon={FileTextIcon}
              label={documentActionsMessages.downloadTxt}
              disabledReason={preparing}
              onSelect={run('txt')}
            />
            <DropdownActionItem
              icon={FileDownIcon}
              label={documentActionsMessages.downloadPdf}
              disabledReason={preparing}
              onSelect={run('pdf')}
            />
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
