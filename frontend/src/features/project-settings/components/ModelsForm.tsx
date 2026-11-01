'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { FormField, SaveBar } from '@/shared/components/form'
import type { RunConfigDefinition } from '@/shared/components/run-config'
import { FieldGroup } from '@/shared/components/ui/field'
import { NativeSelect, NativeSelectOption } from '@/shared/components/ui/native-select'

import { useUpdateProject } from '../hooks/useUpdateProject'
import { modelsFormSchema } from '../project-settings.schema'
import type { ModelEntry, SettingsProject } from '../project-settings.types'

interface ModelsFormProps {
  project: SettingsProject
  definition: RunConfigDefinition
  models: ModelEntry[]
}

/** One model for each agent role; a role left empty takes the model of the user. */
export function ModelsForm({ project, definition, models }: ModelsFormProps) {
  const form = useForm({
    resolver: zodResolver(modelsFormSchema),
    defaultValues: {
      model_overrides: Object.fromEntries(
        definition.agent_roles.map(({ key }) => [key, project.model_overrides[key] ?? '']),
      ),
    },
  })
  const update = useUpdateProject(project.id, {
    setError: form.setError,
    schema: modelsFormSchema,
  })

  const onSubmit = form.handleSubmit((patch) => {
    update.mutate(patch)
  })

  return (
    <form
      noValidate
      aria-label="Models"
      className="flex max-w-xl flex-col"
      onSubmit={(event) => {
        void onSubmit(event)
      }}
    >
      <p className="pb-4 text-xs text-muted-foreground">
        A role left on the default takes the model of your own settings.
      </p>
      <FieldGroup>
        {definition.agent_roles.map((role) => (
          <FormField
            key={role.key}
            control={form.control}
            name={`model_overrides.${role.key}`}
            label={role.label}
            description={role.description}
          >
            {(field, control) => (
              <NativeSelect {...field} {...control}>
                <NativeSelectOption value="">Default of my settings</NativeSelectOption>
                {models
                  .filter(({ allowed_roles }) => allowed_roles.includes(role.key))
                  .map((model) => (
                    <NativeSelectOption key={model.model_id} value={model.model_id}>
                      {model.display_name}
                    </NativeSelectOption>
                  ))}
              </NativeSelect>
            )}
          </FormField>
        ))}
      </FieldGroup>
      <SaveBar pending={update.isPending} error={update.formError} saved={update.isSuccess} />
    </form>
  )
}
