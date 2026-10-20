'use client'

import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
} from 'lucide-react'

import { type Project, projectName } from '@/modules/project/entities'
import { useArchiveProject } from '@/modules/project/features/archive'
import { useOpenDeleteProjectDialog } from '@/modules/project/features/delete'
import { useOpenRenameProjectDialog } from '@/modules/project/features/rename'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'

interface ProjectActionsMenuProps {
  project: Project
}

/**
 * The menu of a row of the project list: Rename, Archive, or Restore for an archived project, then
 * Delete, which asks first. Rename and Delete open the dialogs of `ProjectDialogs`. The button
 * always shows, also on a screen without a pointer to hover the row.
 */
export function ProjectActionsMenu({ project }: ProjectActionsMenuProps) {
  const { archive, restore } = useArchiveProject()
  const openRename = useOpenRenameProjectDialog()
  const openDelete = useOpenDeleteProjectDialog()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {/* Positioned, so that it lies over the link that covers the row. */}
        <Button variant="ghost" size="icon-sm" className="relative text-muted-foreground">
          <MoreHorizontalIcon aria-hidden />
          <span className="sr-only">Actions for {projectName(project)}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem
          onSelect={() => {
            openRename(project.id)
          }}
        >
          <PencilIcon aria-hidden />
          Rename
        </DropdownMenuItem>
        {project.status === 'archived' ? (
          <DropdownMenuItem
            onSelect={() => {
              restore(project)
            }}
          >
            <ArchiveRestoreIcon aria-hidden />
            Restore
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onSelect={() => {
              archive(project)
            }}
          >
            <ArchiveIcon aria-hidden />
            Archive
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => {
            openDelete(project.id)
          }}
        >
          <Trash2Icon aria-hidden />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
