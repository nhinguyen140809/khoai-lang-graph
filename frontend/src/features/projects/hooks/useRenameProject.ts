import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { UseFormSetError } from 'react-hook-form'
import { toast } from 'sonner'

import { formErrorOf, showFieldProblems } from '@/shared/components/form'

import { projectMessages } from '../constants/projects.constants'
import { renameProject } from '../projects.api'
import { projectKeys } from '../projects.keys'
import { projectName } from '../projects.utils'
import { type RenameProjectForm, renameProjectFormSchema } from '../schemas/rename-project.schema'

/**
 * Renames a project from the values of its form. Once the projects have loaded again with the new
 * name, `onRenamed` runs and a toast names the project. When renaming fails, the problems of the
 * API show at the field through `setError`, and `formError` holds any other failure.
 */
export function useRenameProject(
  projectId: string,
  setError: UseFormSetError<RenameProjectForm>,
  onRenamed: () => void,
) {
  const queryClient = useQueryClient()
  const rename = useMutation({
    mutationFn: ({ name }: RenameProjectForm) => renameProject(projectId, name),
    onSuccess: async (project) => {
      await queryClient.invalidateQueries({ queryKey: projectKeys.all() })
      toast.success(projectMessages.renamed, { description: projectName(project) })
      onRenamed()
    },
    onError: (error) => {
      showFieldProblems(setError, error, renameProjectFormSchema)
    },
  })
  return { ...rename, formError: formErrorOf(rename.error, renameProjectFormSchema) }
}
