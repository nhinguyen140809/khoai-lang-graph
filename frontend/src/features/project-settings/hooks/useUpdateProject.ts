import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { FieldValues, UseFormSetError } from 'react-hook-form'
import type { z } from 'zod'

import { formErrorOf, showFieldProblems } from '@/shared/components/form'

import { patchProject } from '../project-settings.api'
import type { ProjectPatch } from '../project-settings.types'

/** The form that changes a part of a project: its `setError` and its schema. */
interface ProjectForm<T extends FieldValues> {
  setError: UseFormSetError<T>
  schema: z.ZodType
}

/**
 * Saves a part of the settings of a project, then reads again what shows the project. The problems
 * of the API show at the fields of `form`, and `formError` holds any other failure.
 */
export function useUpdateProject<T extends FieldValues>(projectId: string, form: ProjectForm<T>) {
  const queryClient = useQueryClient()
  const update = useMutation({
    mutationFn: (patch: ProjectPatch) => patchProject(projectId, patch),
    onSuccess: () =>
      queryClient
        .invalidateQueries({ queryKey: ['projects'] })
        .then(() =>
          queryClient.invalidateQueries({ queryKey: ['project-settings', 'project', projectId] }),
        ),
    onError: (error) => {
      showFieldProblems(form.setError, error, form.schema)
    },
  })
  return { ...update, formError: formErrorOf(update.error, form.schema) }
}
