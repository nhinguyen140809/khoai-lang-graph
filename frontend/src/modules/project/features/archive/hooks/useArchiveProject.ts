import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  archiveProject,
  type Project,
  projectKeys,
  projectName,
  restoreProject,
} from '@/modules/project/entities'
import { errorMessageOf } from '@/shared/api/error/api-error.utils'
import { actionToastDuration } from '@/shared/lib/toast.constants'

import { archiveProjectMessages } from '../archive-project.constants'

/**
 * Archives a project, or restores an archived one to the active projects. Once the projects have
 * loaded again, a toast names the project; the toast of `archive` offers Undo, which restores it,
 * and stays as long as every toast with an action. A failure shows as a toast, in the words of the
 * error.
 */
export function useArchiveProject() {
  const queryClient = useQueryClient()
  const reload = () => queryClient.invalidateQueries({ queryKey: projectKeys.all() })

  const restore = useMutation({
    mutationFn: (project: Project) => restoreProject(project.id),
    onSuccess: async (_, project) => {
      await reload()
      toast.success(archiveProjectMessages.restored, { description: projectName(project) })
    },
    onError: (error) => {
      toast.error(errorMessageOf(error, {}))
    },
  })
  const archive = useMutation({
    mutationFn: (project: Project) => archiveProject(project.id),
    onSuccess: async (_, project) => {
      await reload()
      toast.success(archiveProjectMessages.archived, {
        description: projectName(project),
        duration: actionToastDuration,
        action: {
          label: archiveProjectMessages.undo,
          onClick: () => {
            restore.mutate(project)
          },
        },
      })
    },
    onError: (error) => {
      toast.error(errorMessageOf(error, {}))
    },
  })

  return { archive: archive.mutate, restore: restore.mutate }
}
