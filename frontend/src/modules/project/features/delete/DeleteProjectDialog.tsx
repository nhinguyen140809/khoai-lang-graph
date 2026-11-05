'use client'

import { CircleStopIcon, Trash2Icon } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { type Project, projectName, unfinishedRunCount } from '@/modules/project/entities'
import { ConfirmDialog } from '@/shared/components/ui/confirm-dialog'
import { pluralForm } from '@/shared/lib/text'
import { routes } from '@/shared/routes'

import { useDeleteProject } from './hooks/useDeleteProject'

interface DeleteProjectDialogProps {
  project: Project
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Runs once the dialog has closed, after its animation. */
  onClosed?: () => void
}

/**
 * Deletes a project, from the menu of its row, which opens it through `ProjectDialogs`. It asks
 * first; a project with a run that is not finished is not deleted, and the dialog says to stop the
 * run first.
 */
export function DeleteProjectDialog(props: DeleteProjectDialogProps) {
  return unfinishedRunCount(props.project) > 0 ? (
    <StopRunFirstDialog {...props} />
  ) : (
    <ConfirmDeleteDialog {...props} />
  )
}

/** Asks before deleting a project, and waits until it has left the list; a failure leaves it open. */
function ConfirmDeleteDialog({ project, open, onOpenChange, onClosed }: DeleteProjectDialogProps) {
  const deleteProject = useDeleteProject()

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      onClosed={onClosed}
      destructive
      icon={<Trash2Icon />}
      title="Delete project?"
      description={
        <>
          This deletes <span className="font-bold text-foreground">{projectName(project)}</span>{' '}
          with its documents and its activity. You cannot undo this.
        </>
      }
      confirmLabel="Delete project"
      onConfirm={() => deleteProject.mutateAsync(project)}
    />
  )
}

/**
 * Says that a project cannot be deleted while a run of it is not finished, and opens the project at
 * its activity, where the run is stopped.
 */
function StopRunFirstDialog({ project, open, onOpenChange, onClosed }: DeleteProjectDialogProps) {
  const router = useRouter()
  const runs = unfinishedRunCount(project)

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      onClosed={onClosed}
      icon={<CircleStopIcon />}
      title={`Stop the ${pluralForm(runs, { one: 'run', other: 'runs' })} first`}
      description={
        <>
          <span className="font-bold text-foreground">{projectName(project)}</span>{' '}
          {runs === 1
            ? 'has a run that is not finished. Stop it in the project, then delete the project.'
            : `has ${String(runs)} runs that are not finished. Stop them in the project, then delete the project.`}
        </>
      }
      cancelLabel="Close"
      confirmLabel="Open project"
      onConfirm={() => {
        router.push(routes.project(project.id).activity())
      }}
    />
  )
}
