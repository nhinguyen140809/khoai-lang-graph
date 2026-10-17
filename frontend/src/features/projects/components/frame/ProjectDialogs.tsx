'use client'

import { useProjectDialog } from '../../hooks/useOpenProjectDialog'
import { useProject } from '../../hooks/useProjectQueries'
import { DeleteProjectDialog } from '../delete-project/DeleteProjectDialog'
import { RenameProjectDialog } from '../rename-project/RenameProjectDialog'

/**
 * The dialogs that act on one project, Rename and Delete, which the menus, the rows of the project
 * list and the command palette open with `useOpenProjectDialog`. Each layout mounts it once, so
 * that the screen has one of each, whatever opens it. The project is read from the queries, and
 * stays while its dialog closes.
 */
export function ProjectDialogs() {
  const { dialog, projectId, open, setOpen, closed } = useProjectDialog()
  const project = useProject(projectId ?? undefined)

  if (dialog === null || project.data === undefined) return null

  // A dialog of another project starts afresh, even when the one before has not finished closing.
  const key = `${dialog}:${project.data.id}`
  const props = { project: project.data, open, onOpenChange: setOpen, onClosed: closed }
  return dialog === 'rename' ? (
    <RenameProjectDialog key={key} {...props} />
  ) : (
    <DeleteProjectDialog key={key} {...props} />
  )
}
