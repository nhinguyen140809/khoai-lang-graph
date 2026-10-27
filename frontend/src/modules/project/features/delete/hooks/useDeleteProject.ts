import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { deleteProject, type Project, projectKeys, projectName } from '@/modules/project/entities'
import { errorMessageOf } from '@/shared/api/error'

import { deleteProjectMessages } from '../delete-project.constants'

/**
 * Deletes a project, forgets it and loads the lists of projects again; `mutateAsync` settles once
 * they have loaded, without the project. A toast then names the project. A failure shows as a
 * toast, in the words of the error, and `mutateAsync` rejects.
 */
export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (project: Project) => deleteProject(project.id),
    onSuccess: async (_, project) => {
      queryClient.removeQueries({ queryKey: projectKeys.detail(project.id) })
      await queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
      toast.success(deleteProjectMessages.deleted, { description: projectName(project) })
    },
    onError: (error) => {
      toast.error(errorMessageOf(error, {}))
    },
  })
}
