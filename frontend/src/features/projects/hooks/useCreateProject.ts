import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import type { UseFormSetError } from 'react-hook-form'

import { formErrorOf, showFieldProblems } from '@/shared/components/form'
import { routes } from '@/shared/config/routes'

import { createProject } from '../projects.api'
import { type NewProjectForm, newProjectFormSchema } from '../projects.schema'
import type { CreateProjectBody } from '../projects.types'
import { projectsQueryKey } from './useProjects'

/**
 * Creates a project, then opens its console, which creates its thread on the first visit. The
 * problems of the API show at the fields of the form, and `formError` holds any other failure.
 */
export function useCreateProject(setError: UseFormSetError<NewProjectForm>) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const create = useMutation({
    mutationFn: async (body: CreateProjectBody) => {
      const project = await createProject(body)
      return { projectId: project.id }
    },
    onSuccess: ({ projectId }) => {
      void queryClient.invalidateQueries({ queryKey: projectsQueryKey })
      router.push(routes.project(projectId).console())
    },
    onError: (error) => {
      showFieldProblems(setError, error, newProjectFormSchema)
    },
  })
  return { ...create, formError: formErrorOf(create.error, newProjectFormSchema) }
}
