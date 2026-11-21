'use client'

import { ArchiveIcon, ArchiveRestoreIcon, PencilIcon, Trash2Icon } from 'lucide-react'

import { MenuItem, MenuSeparator } from '@/shared/components/menu'

import { projectActionMessages } from '../projects/projects.constants'
import type { Project } from '../projects/projects.types'

interface ProjectActionItemsProps {
  project: Pick<Project, 'status'>
  onRename: () => void
  onArchive: () => void
  onRestore: () => void
  /** Opens the dialog that asks before the project is deleted. */
  onDelete: () => void
}

/**
 * The items of the menu of one project, inside a menu, a `MenuContent` or a `DropdownMenuContent`: Rename, then Archive, or
 * Restore for an archived project, then Delete. The menu that places them says what each does,
 * with the features of the project.
 */
export function ProjectActionItems({
  project,
  onRename,
  onArchive,
  onRestore,
  onDelete,
}: ProjectActionItemsProps) {
  return (
    <>
      <MenuItem onSelect={onRename}>
        <PencilIcon aria-hidden />
        {projectActionMessages.rename}
      </MenuItem>
      {project.status === 'archived' ? (
        <MenuItem onSelect={onRestore}>
          <ArchiveRestoreIcon aria-hidden />
          {projectActionMessages.restore}
        </MenuItem>
      ) : (
        <MenuItem onSelect={onArchive}>
          <ArchiveIcon aria-hidden />
          {projectActionMessages.archive}
        </MenuItem>
      )}
      <MenuSeparator />
      <MenuItem variant="destructive" onSelect={onDelete}>
        <Trash2Icon aria-hidden />
        {projectActionMessages.delete}
      </MenuItem>
    </>
  )
}
