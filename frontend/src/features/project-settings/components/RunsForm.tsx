'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { FormProvider, useForm } from 'react-hook-form'

import { SaveBar } from '@/shared/components/form'
import {
  parameterFields,
  type RunConfigDefinition,
  RunConfigFields,
  runFormOf,
} from '@/shared/components/run-config'

import { useUpdateProject } from '../hooks/useUpdateProject'
import { runsFormSchema } from '../project-settings.schema'
import type { SettingsProject } from '../project-settings.types'

interface RunsFormProps {
  project: SettingsProject
  definition: RunConfigDefinition
}

/** The run settings of the project: what a field leaves empty takes the value of the user. */
export function RunsForm({ project, definition }: RunsFormProps) {
  const fields = useMemo(() => parameterFields(definition), [definition])
  const schema = useMemo(() => runsFormSchema(fields), [fields])
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { run_config: runFormOf(project.run_config, fields) },
  })
  const update = useUpdateProject(project.id, { setError: form.setError, schema })

  const onSubmit = form.handleSubmit((patch) => {
    update.mutate(patch)
  })

  return (
    <FormProvider {...form}>
      <form
        noValidate
        aria-label="Runs"
        className="flex max-w-xl flex-col"
        onSubmit={(event) => {
          void onSubmit(event)
        }}
      >
        <p className="pb-4 text-xs text-muted-foreground">
          A field left empty takes the value of your own settings.
        </p>
        <RunConfigFields definition={definition} name="run_config" defaultLabel="Use my default" />
        <SaveBar pending={update.isPending} error={update.formError} saved={update.isSuccess} />
      </form>
    </FormProvider>
  )
}
