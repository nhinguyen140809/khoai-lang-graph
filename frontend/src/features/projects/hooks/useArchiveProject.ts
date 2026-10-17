import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { errorMessageOf } from '@/shared/api/api-error.utils'

import { projectMessages } from '../constants/projects.constants'
import { archiveProject, restoreProject } from '../projects.api'
import { projectKeys } from '../projects.keys'
import type { Project } from '../projects.types'
import { projectName } from '../projects.utils'

/**
 * Archives a project, or restores an archived one to the active projects. Once the projects have
 * loaded again, a toast names the project; the toast of `archive` offers Undo, which restores it.
 * A failure shows as a toast, in the words of the error.
 */
export function useArchiveProject() {
  const queryClient = useQueryClient()
  const reload = () => queryClient.invalidateQueries({ queryKey: projectKeys.all() })

  const restore = useMutation({
    mutationFn: (project: Project) => restoreProject(project.id),
    onSuccess: async (_, project) => {
      await reload()
      toast.success(projectMessages.restored, { description: projectName(project) })
    },
    onError: (error) => {
      toast.error(errorMessageOf(error, {}))
    },
  })
  const archive = useMutation({
    mutationFn: (project: Project) => archiveProject(project.id),
    onSuccess: async (_, project) => {
      await reload()
      toast.success(projectMessages.archived, {
        description: projectName(project),
        action: {
          label: projectMessages.undo,
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
