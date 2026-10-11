'use client'

import { useMemo, useState } from 'react'

import {
  parameterFields,
  type RunConfigDefinition,
  RunConfigFields,
  type RunForm,
  runFormOf,
  toRunConfig,
  validateRunForm,
} from '@/components/run-config'

import { formErrorMessage, serverFieldErrors } from '../form-errors.utils'
import { useUpdateProject } from '../hooks/useUpdateProject'
import type { SettingsProject } from '../project-settings.types'
import { SaveBar } from './SaveBar'

interface RunsFormProps {
  project: SettingsProject
  definition: RunConfigDefinition
}

/** The run settings of the project: what a field leaves empty takes the value of the user. */
export function RunsForm({ project, definition }: RunsFormProps) {
  const update = useUpdateProject(project.id)
  const fields = useMemo(() => parameterFields(definition), [definition])
  const [form, setForm] = useState<RunForm>(() => runFormOf(project.run_config))
  const [problems, setProblems] = useState<Record<string, string>>({})
  const shown = { ...serverFieldErrors(update.error, 'run_config.'), ...problems }

  const save = () => {
    const found = validateRunForm(form, fields)
    setProblems(found)
    if (Object.keys(found).length > 0) return
    update.mutate({ run_config: toRunConfig(form, fields) })
  }

  return (
    <form
      noValidate
      aria-label="Runs"
      className="flex max-w-xl flex-col"
      onSubmit={(event) => {
        event.preventDefault()
        save()
      }}
    >
      <p className="pb-4 text-xs text-muted-foreground">
        A field left empty takes the value of your own settings.
      </p>
      <RunConfigFields
        definition={definition}
        form={form}
        onChange={setForm}
        problems={shown}
        defaultLabel="Use my default"
      />
      <SaveBar
        pending={update.isPending}
        error={formErrorMessage(update.error)}
        saved={update.isSuccess}
      />
    </form>
  )
}
