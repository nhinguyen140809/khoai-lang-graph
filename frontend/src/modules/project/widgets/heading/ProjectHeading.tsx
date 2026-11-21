'use client'

import { ChevronDownIcon, RotateCcwIcon } from 'lucide-react'

import { ProjectActionItems, ProjectName, useProject } from '@/modules/project/entities'
import { useArchiveProject } from '@/modules/project/features/archive'
import { useOpenDeleteProjectDialog } from '@/modules/project/features/delete'
import { useOpenRenameProjectDialog } from '@/modules/project/features/rename'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'

import { projectHeadingMessages } from './project-heading.constants'

/**
 * The name of the open project at the left of the bar of its chat, with a chevron. Both are one
 * button, which opens the menu of the project: Rename, Archive or Restore, and Delete, in the
 * dialogs of `ProjectDialogs`. The menu offers no other project, since the side list holds them; a
 * project that failed to load offers to load it again.
 */
export function ProjectHeading({ projectId }: { projectId: string }) {
  const project = useProject(projectId)
  const shown = project.data
  const { archive, restore } = useArchiveProject()
  const openRename = useOpenRenameProjectDialog()
  const openDelete = useOpenDeleteProjectDialog()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="min-w-0 gap-1 px-2 text-sm font-bold">
          <ProjectName projectId={projectId} />
          <ChevronDownIcon aria-hidden className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {shown === undefined ? (
          <DropdownMenuItem disabled={project.isPending} onSelect={() => void project.refetch()}>
            <RotateCcwIcon aria-hidden />
            {projectHeadingMessages.reload}
          </DropdownMenuItem>
        ) : (
          <ProjectActionItems
            project={shown}
            onRename={() => {
              openRename(projectId)
            }}
            onArchive={() => {
              archive(shown)
            }}
            onRestore={() => {
              restore(shown)
            }}
            onDelete={() => {
              openDelete(projectId)
            }}
          />
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
