'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { type Control, useForm, useWatch } from 'react-hook-form'

import { FormField, SaveBar, TextField } from '@/shared/components/form'
import type { RunConfigDefinition } from '@/shared/components/run-config'
import { FieldGroup } from '@/shared/components/ui/field'
import { NativeSelect, NativeSelectOption } from '@/shared/components/ui/native-select'

import { useSaveModelChoices } from '../hooks/useAccountQueries'
import { type ModelChoicesForm as Choices, modelChoicesFormSchema } from '../settings.schema'
import type { CatalogModel, ModelChoice } from '../settings.types'

interface ModelChoicesFormProps {
  definition: RunConfigDefinition
  catalog: CatalogModel[]
  choices: ModelChoice[]
}

type Role = RunConfigDefinition['agent_roles'][number]

/** The model of each agent role, and its temperature; a role left on the default uses the server default. */
export function ModelChoicesForm({ definition, catalog, choices }: ModelChoicesFormProps) {
  const form = useForm({
    resolver: zodResolver(modelChoicesFormSchema),
    defaultValues: {
      choices: Object.fromEntries(
        definition.agent_roles.map(({ key }) => {
          const chosen = choices.find(({ agent_role }) => agent_role === key)
          return [
            key,
            {
              model_id: chosen?.model_id ?? '',
              temperature: chosen?.temperature == null ? '' : String(chosen.temperature),
            },
          ]
        }),
      ),
    },
  })
  const save = useSaveModelChoices(form.setError)

  const onSubmit = form.handleSubmit((items) => {
    save.mutate(items)
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
        A project can choose other models for its own runs. A role left on the default uses the
        default of the server.
      </p>
      <FieldGroup>
        {definition.agent_roles.map((role) => (
          <ChoiceRow
            key={role.key}
            control={form.control}
            role={role}
            models={catalog.filter(({ allowed_roles }) => allowed_roles.includes(role.key))}
          />
        ))}
      </FieldGroup>
      <SaveBar pending={save.isPending} error={save.formError} saved={save.isSuccess} />
    </form>
  )
}

interface ChoiceRowProps {
  control: Control<Choices, unknown, ModelChoice[]>
  role: Role
  models: CatalogModel[]
}

/** The model of one role, and beside it its temperature, which waits for a model to be chosen. */
function ChoiceRow({ control, role, models }: ChoiceRowProps) {
  const model = useWatch({ control, name: `choices.${role.key}.model_id` })
  return (
    <div className="flex items-start gap-2">
      <div className="min-w-0 flex-1">
        <FormField
          control={control}
          name={`choices.${role.key}.model_id`}
          label={role.label}
          description={role.description}
        >
          {(field, controlProps) => (
            <NativeSelect {...field} {...controlProps}>
              <NativeSelectOption value="">Server default</NativeSelectOption>
              {models.map((entry) => (
                <NativeSelectOption key={entry.model_id} value={entry.model_id}>
                  {entry.display_name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          )}
        </FormField>
      </div>
      <div className="w-24">
        <TextField
          control={control}
          name={`choices.${role.key}.temperature`}
          label={
            <>
              Temperature<span className="sr-only"> of {role.label}</span>
            </>
          }
          inputMode="decimal"
          disabled={model === ''}
        />
      </div>
    </div>
  )
}
