import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createProject } from '../projects.api'
import type { CreateProjectBody } from '../projects.types'
import { projectsQueryKey } from './useProjects'

/** Creates a project; the session creates its thread on the first visit. */
export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (body: CreateProjectBody) => {
      const project = await createProject(body)
      return { projectId: project.id }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectsQueryKey })
    },
  })
}
