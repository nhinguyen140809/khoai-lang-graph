'use client'

import type { ComponentType } from 'react'

import { type Project, useProject } from '@/modules/project/entities'
import { DeleteProjectDialog, useDeleteProjectDialog } from '@/modules/project/features/delete'
import { RenameProjectDialog, useRenameProjectDialog } from '@/modules/project/features/rename'

/**
 * The dialogs that act on one project, Rename and Delete, which the menus, the rows of the project
 * list and the command palette open. Each layout mounts it once, so that the screen has one of
 * each, whatever opens it.
 */
export function ProjectDialogs() {
  return (
    <>
      <ProjectDialog state={useRenameProjectDialog()} Dialog={RenameProjectDialog} />
      <ProjectDialog state={useDeleteProjectDialog()} Dialog={DeleteProjectDialog} />
    </>
  )
}

interface DialogProps {
  project: Project
  open: boolean
  onOpenChange: (open: boolean) => void
  onClosed: () => void
}

interface ProjectDialogProps {
  state: Omit<DialogProps, 'project' | 'onOpenChange' | 'onClosed'> & {
    projectId: string | null
    setOpen: (open: boolean) => void
    closed: () => void
  }
  Dialog: ComponentType<DialogProps>
}

/** One dialog of a project. The project is read from the queries, and stays while the dialog closes. */
function ProjectDialog({ state, Dialog }: ProjectDialogProps) {
  const project = useProject(state.projectId ?? undefined)

  if (state.projectId === null || project.data === undefined) return null

  // A dialog of another project starts afresh, even when the one before has not finished closing.
  return (
    <Dialog
      key={project.data.id}
      project={project.data}
      open={state.open}
      onOpenChange={state.setOpen}
      onClosed={state.closed}
    />
  )
}
