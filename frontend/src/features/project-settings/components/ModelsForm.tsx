'use client'

import { useState } from 'react'

import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'

import { formErrorMessage, serverFieldErrors } from '../form-errors.utils'
import { useUpdateProject } from '../hooks/useUpdateProject'
import type { ModelEntry, SettingsDefinition, SettingsProject } from '../project-settings.types'
import { SaveBar } from './SaveBar'

interface ModelsFormProps {
  project: SettingsProject
  definition: SettingsDefinition
  models: ModelEntry[]
}

/** One model for each agent role; a role left empty takes the model of the user. */
export function ModelsForm({ project, definition, models }: ModelsFormProps) {
  const update = useUpdateProject(project.id)
  const [chosen, setChosen] = useState<Record<string, string>>(project.model_overrides)
  const errors = serverFieldErrors(update.error, 'model_overrides.')

  return (
    <form
      noValidate
      aria-label="Models"
      className="flex max-w-xl flex-col"
      onSubmit={(event) => {
        event.preventDefault()
        update.mutate({
          model_overrides: Object.fromEntries(
            Object.entries(chosen).filter(([, model]) => model !== ''),
          ),
        })
      }}
    >
      <p className="pb-4 text-xs text-muted-foreground">
        A role left on the default takes the model of your own settings.
      </p>
      <FieldGroup>
        {definition.agent_roles.map((role) => (
          <Field key={role.key} data-invalid={errors[role.key] !== undefined}>
            <FieldLabel htmlFor={`model-${role.key}`}>{role.label}</FieldLabel>
            <NativeSelect
              id={`model-${role.key}`}
              value={chosen[role.key] ?? ''}
              aria-invalid={errors[role.key] !== undefined}
              onChange={(event) => {
                setChosen({ ...chosen, [role.key]: event.target.value })
              }}
            >
              <NativeSelectOption value="">Default of my settings</NativeSelectOption>
              {models
                .filter(({ allowed_roles }) => allowed_roles.includes(role.key))
                .map((model) => (
                  <NativeSelectOption key={model.model_id} value={model.model_id}>
                    {model.display_name}
                  </NativeSelectOption>
                ))}
            </NativeSelect>
            <FieldDescription>{role.description}</FieldDescription>
            <FieldError>{errors[role.key]}</FieldError>
          </Field>
        ))}
      </FieldGroup>
      <SaveBar
        pending={update.isPending}
        error={formErrorMessage(update.error)}
        saved={update.isSuccess}
      />
    </form>
  )
}
