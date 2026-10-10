import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createProject, createThread } from '../projects.api'
import type { CreateProjectBody } from '../projects.types'
import { projectsQueryKey } from './useProjects'

/** Creates a project and its first, empty thread; resolves with both ids. */
export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (body: CreateProjectBody) => {
      const project = await createProject(body)
      const thread = await createThread(project.id)
      return { projectId: project.id, threadId: thread.id }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectsQueryKey })
    },
  })
}
