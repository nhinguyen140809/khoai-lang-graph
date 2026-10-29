import { useIsMutating, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import type { UseFormSetError } from 'react-hook-form'
import { toast } from 'sonner'

import { createProject, projectKeys, updateProjectRunConfig } from '@/modules/project/entities'
import { isRunDefaultsEmpty, toRunDefaults } from '@/modules/run/entities'
import { sendFirstMessage } from '@/modules/thread/entities'
import type { RunParameterField } from '@/modules/workflow/entities'
import { errorMessageOf } from '@/shared/api/error'
import { newIdempotencyKey } from '@/shared/api/idempotency'
import { formErrorOf, showFieldProblems } from '@/shared/components/form'
import { routes } from '@/shared/routes'

import { createProjectMessages } from '../new-project.constants'
import type { NewProject, NewProjectForm, NewProjectFormSchema } from '../new-project.schema'

interface CreateProjectOptions {
  /** The `setError` of the form, which shows the problems of the API at its fields. */
  setError: UseFormSetError<NewProjectForm>
  /** Runs once the project exists, before the project opens. */
  onCreated: () => void
  /** The schema that the form checks its values with, so that the problems of the API map to the same fields. */
  schema: NewProjectFormSchema
  /** The fields of the run parameters that the form shows, as `useRunSettingsOptions` gives them. */
  parameterFields: RunParameterField[]
}

/** What went wrong after the project existed: its settings did not save, or its idea did not send. */
interface FollowUpFailure {
  step: 'settings' | 'idea'
  error: unknown
}

/**
 * Creates a project from the values of its form, saves its run settings when any is set, then
 * sends the idea as its first message, so that the first run starts with the settings. Once the
 * project exists, the list of projects loads again, `onCreated` runs and the project opens at its
 * activity, even when a later step fails: that failure shows as a toast, and the idea is not sent
 * when the settings did not save, since its run would start without them. When creating fails, the
 * problems of the API show at the fields of the form through `setError`, and `formError` holds any
 * other failure.
 */
export function useCreateProject({
  setError,
  onCreated,
  schema,
  parameterFields,
}: CreateProjectOptions) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const create = useMutation({
    mutationKey: projectKeys.create(),
    // Resolves to the project and the failure of a later step, if any.
    mutationFn: async ({ idea, run_config: runSettings, ...body }: NewProject) => {
      // One key for each submit. The mutation never runs twice for one submit, so the key can be
      // made here; a mutation that retries must make it before, and pass it in its variables.
      const idempotencyKey = newIdempotencyKey()
      const project = await createProject(body)
      const runConfig = toRunDefaults(runSettings, parameterFields)
      if (!isRunDefaultsEmpty(runConfig)) {
        try {
          await updateProjectRunConfig(project.id, runConfig)
        } catch (error) {
          return { project, failure: { step: 'settings', error } satisfies FollowUpFailure }
        }
      }
      try {
        await sendFirstMessage(project.id, idea, idempotencyKey)
      } catch (error) {
        return { project, failure: { step: 'idea', error } satisfies FollowUpFailure }
      }
      return { project, failure: null }
    },
    onSuccess: ({ project, failure }) => {
      void queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
      if (failure !== null) {
        toast.error(
          failure.step === 'settings'
            ? createProjectMessages.settingsNotSaved
            : createProjectMessages.ideaNotSent,
          {
            description:
              failure.error instanceof Error ? errorMessageOf(failure.error, {}) : undefined,
          },
        )
      }
      onCreated()
      router.push(routes.project(project.id).activity())
    },
    onError: (error) => {
      showFieldProblems(setError, error, schema)
    },
  })
  return { ...create, formError: formErrorOf(create.error, schema) }
}

/**
 * Whether a project is being created, for what holds the form that creates it, such as its dialog,
 * which stays open until the project exists.
 */
export function useIsCreatingProject(): boolean {
  return useIsMutating({ mutationKey: projectKeys.create() }) > 0
}
