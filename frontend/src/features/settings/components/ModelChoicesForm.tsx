'use client'

import { useState } from 'react'

import type { RunConfigDefinition } from '@/shared/components/run-config'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { NativeSelect, NativeSelectOption } from '@/shared/ui/native-select'

import { formErrorMessage, serverFieldErrors } from '../form-errors.utils'
import { useSaveModelChoices } from '../hooks/useAccountQueries'
import type { CatalogModel, ModelChoice } from '../settings.types'
import { SaveBar } from './SaveBar'

interface ModelChoicesFormProps {
  definition: RunConfigDefinition
  catalog: CatalogModel[]
  choices: ModelChoice[]
}

interface Row {
  model: string
  temperature: string
}

/** The model of each agent role, and its temperature; a role left on the default uses the server default. */
export function ModelChoicesForm({ definition, catalog, choices }: ModelChoicesFormProps) {
  const save = useSaveModelChoices()
  const [rows, setRows] = useState<Record<string, Row>>(() =>
    Object.fromEntries(
      choices.map((choice) => [
        choice.agent_role,
        {
          model: choice.model_id,
          temperature: choice.temperature === null ? '' : String(choice.temperature),
        },
      ]),
    ),
  )
  const [problems, setProblems] = useState<Record<string, string>>({})
  const errors = serverFieldErrors(save.error)

  const setRow = (role: string, change: Partial<Row>) => {
    setRows({ ...rows, [role]: { model: '', temperature: '', ...rows[role], ...change } })
  }

  return (
    <form
      noValidate
      aria-label="Models"
      className="flex max-w-xl flex-col"
      onSubmit={(event) => {
        event.preventDefault()
        const found: Record<string, string> = {}
        const items: ModelChoice[] = []
        for (const [role, row] of Object.entries(rows)) {
          if (row.model === '') continue
          const text = row.temperature.trim()
          const temperature = text === '' ? null : Number(text)
          if (temperature !== null && !(temperature >= 0 && temperature <= 2)) {
            found[role] = 'Enter a number from 0 to 2.'
          }
          items.push({ agent_role: role, model_id: row.model, temperature })
        }
        setProblems(found)
        if (Object.keys(found).length === 0) save.mutate(items)
      }}
    >
      <p className="pb-4 text-xs text-muted-foreground">
        A project can choose other models for its own runs. A role left on the default uses the
        default of the server.
      </p>
      <FieldGroup>
        {definition.agent_roles.map((role) => {
          const row = rows[role.key]
          const problem =
            problems[role.key] ??
            errors[`items.${role.key}`] ??
            errors[`items.${role.key}.temperature`]
          return (
            <Field key={role.key} data-invalid={problem !== undefined}>
              <FieldLabel htmlFor={`choice-${role.key}`}>{role.label}</FieldLabel>
              <div className="flex gap-2">
                <NativeSelect
                  id={`choice-${role.key}`}
                  className="flex-1"
                  value={row?.model ?? ''}
                  aria-invalid={problem !== undefined}
                  onChange={(event) => {
                    setRow(role.key, { model: event.target.value })
                  }}
                >
                  <NativeSelectOption value="">Server default</NativeSelectOption>
                  {catalog
                    .filter(({ allowed_roles }) => allowed_roles.includes(role.key))
                    .map((model) => (
                      <NativeSelectOption key={model.model_id} value={model.model_id}>
                        {model.display_name}
                      </NativeSelectOption>
                    ))}
                </NativeSelect>
                <Input
                  aria-label={`Temperature of ${role.label}`}
                  className="w-24"
                  inputMode="decimal"
                  placeholder="Temp."
                  disabled={(row?.model ?? '') === ''}
                  value={row?.temperature ?? ''}
                  onChange={(event) => {
                    setRow(role.key, { temperature: event.target.value })
                  }}
                />
              </div>
              <FieldDescription>{role.description}</FieldDescription>
              <FieldError>{problem}</FieldError>
            </Field>
          )
        })}
      </FieldGroup>
      <SaveBar
        pending={save.isPending}
        error={formErrorMessage(save.error)}
        saved={save.isSuccess}
      />
    </form>
  )
}
