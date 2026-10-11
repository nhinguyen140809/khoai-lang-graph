import { useMutation, useQueryClient } from '@tanstack/react-query'

import { patchProject } from '../project-settings.api'
import type { ProjectPatch } from '../project-settings.types'

/** Saves a part of the settings of a project; what shows the project is read again. */
export function useUpdateProject(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (patch: ProjectPatch) => patchProject(projectId, patch),
    onSuccess: () =>
      queryClient
        .invalidateQueries({ queryKey: ['projects'] })
        .then(() =>
          queryClient.invalidateQueries({ queryKey: ['project-settings', 'project', projectId] }),
        ),
  })
}
