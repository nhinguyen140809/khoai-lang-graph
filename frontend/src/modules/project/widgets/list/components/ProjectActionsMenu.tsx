'use client'

import { MoreHorizontalIcon } from 'lucide-react'

import {
  type Project,
  ProjectActionItems,
  projectActionMessages,
  projectName,
} from '@/modules/project/entities'
import { useArchiveProject } from '@/modules/project/features/archive'
import { useOpenDeleteProjectDialog } from '@/modules/project/features/delete'
import { useOpenRenameProjectDialog } from '@/modules/project/features/rename'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
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
          <span className="sr-only">{projectActionMessages.menu(projectName(project))}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <ProjectActionItems
          project={project}
          onRename={() => {
            openRename(project.id)
          }}
          onArchive={() => {
            archive(project)
          }}
          onRestore={() => {
            restore(project)
          }}
          onDelete={() => {
            openDelete(project.id)
          }}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
