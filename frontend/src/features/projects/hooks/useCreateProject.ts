import { useIsMutating, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import type { UseFormSetError } from 'react-hook-form'
import { toast } from 'sonner'

import { errorMessageOf } from '@/shared/api/api-error.utils'
import { formErrorOf, showFieldProblems } from '@/shared/components/form'
import { routes } from '@/shared/config/routes'

import { projectMessages } from '../constants/projects.constants'
import { createProject, sendFirstMessage } from '../projects.api'
import { projectKeys } from '../projects.keys'
import {
  type NewProject,
  type NewProjectForm,
  newProjectFormSchema,
} from '../schemas/new-project.schema'

/**
 * Creates a project from the values of its form, then sends the idea as its first message. Once
 * the project exists, the list of projects loads again, `onCreated` runs and the project opens at
 * its activity, even when the idea fails to send: that failure shows as a toast. When creating
 * fails, the problems of the API show at the fields of the form through `setError`, and
 * `formError` holds any other failure.
 */
export function useCreateProject(setError: UseFormSetError<NewProjectForm>, onCreated: () => void) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const create = useMutation({
    mutationKey: projectKeys.create(),
    // Resolves to the project and the error that sending the idea threw, if any.
    mutationFn: async ({ idea, ...body }: NewProject) => {
      const project = await createProject(body)
      try {
        await sendFirstMessage(project.id, idea)
      } catch (error) {
        return { project, sendError: error }
      }
      return { project, sendError: null }
    },
    onSuccess: ({ project, sendError }) => {
      void queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
      if (sendError !== null) {
        toast.error(projectMessages.ideaNotSent, {
          description: sendError instanceof Error ? errorMessageOf(sendError, {}) : undefined,
        })
      }
      onCreated()
      router.push(routes.project(project.id).activity())
    },
    onError: (error) => {
      showFieldProblems(setError, error, newProjectFormSchema)
    },
  })
  return { ...create, formError: formErrorOf(create.error, newProjectFormSchema) }
}

/**
 * Whether a project is being created, for what holds the form that creates it, such as its dialog,
 * which stays open until the project exists.
 */
export function useIsCreatingProject(): boolean {
  return useIsMutating({ mutationKey: projectKeys.create() }) > 0
}
