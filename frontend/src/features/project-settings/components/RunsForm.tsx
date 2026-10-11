'use client'

import { useMemo, useState } from 'react'

import { Checkbox } from '@/components/ui/checkbox'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'

import { formErrorMessage, serverFieldErrors } from '../form-errors.utils'
import { useUpdateProject } from '../hooks/useUpdateProject'
import type { SettingsDefinition, SettingsProject } from '../project-settings.types'
import {
  parameterFields,
  type RunForm,
  runFormOf,
  scalarText,
  toRunConfig,
  validateRunForm,
} from '../run-form.utils'
import { SaveBar } from './SaveBar'

interface RunsFormProps {
  project: SettingsProject
  definition: SettingsDefinition
}

/** The run settings of the project: what a field leaves empty takes the value of the user. */
export function RunsForm({ project, definition }: RunsFormProps) {
  const update = useUpdateProject(project.id)
  const fields = useMemo(() => parameterFields(definition), [definition])
  const checkpoints = useMemo(
    () => definition.nodes.filter(({ kind }) => kind === 'checkpoint'),
    [definition.nodes],
  )
  const [form, setForm] = useState<RunForm>(() => runFormOf(project.run_config))
  const [problems, setProblems] = useState<Record<string, string>>({})
  const shown = { ...serverFieldErrors(update.error, 'run_config.'), ...problems }

  const save = () => {
    const found = validateRunForm(form, fields)
    setProblems(found)
    if (Object.keys(found).length > 0) return
    update.mutate({ run_config: toRunConfig(form, fields) })
  }

  const setParameter = (key: string, value: string) => {
    setForm({ ...form, parameters: { ...form.parameters, [key]: value } })
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
      <FieldGroup>
        <FieldSet>
          <FieldLegend variant="label">Review at</FieldLegend>
          <Field orientation="horizontal">
            <Checkbox
              id="checkpoints-default"
              checked={form.checkpoints === null}
              onCheckedChange={(checked) => {
                setForm({
                  ...form,
                  checkpoints: checked === true ? null : checkpoints.map(({ id }) => id),
                })
              }}
            />
            <FieldLabel htmlFor="checkpoints-default">Use my default</FieldLabel>
          </Field>
          {checkpoints.map((node) => (
            <Field key={node.id} orientation="horizontal">
              <Checkbox
                id={`checkpoint-${node.id}`}
                disabled={form.checkpoints === null}
                checked={form.checkpoints?.includes(node.id) ?? false}
                onCheckedChange={(checked) => {
                  const current = form.checkpoints ?? []
                  setForm({
                    ...form,
                    checkpoints:
                      checked === true
                        ? [...current, node.id]
                        : current.filter((id) => id !== node.id),
                  })
                }}
              />
              <FieldLabel htmlFor={`checkpoint-${node.id}`} className="font-mono">
                {node.label}
              </FieldLabel>
            </Field>
          ))}
          <FieldError>{shown.review_checkpoints}</FieldError>
        </FieldSet>

        <Field data-invalid={shown.max_steps !== undefined}>
          <FieldLabel htmlFor="max-steps">Max steps</FieldLabel>
          <Input
            id="max-steps"
            inputMode="numeric"
            value={form.maxSteps}
            aria-invalid={shown.max_steps !== undefined}
            onChange={(event) => {
              setForm({ ...form, maxSteps: event.target.value })
            }}
          />
          <FieldError>{shown.max_steps}</FieldError>
        </Field>
        <Field data-invalid={shown.max_cost_usd !== undefined}>
          <FieldLabel htmlFor="max-cost">Max cost (USD)</FieldLabel>
          <Input
            id="max-cost"
            inputMode="decimal"
            value={form.maxCost}
            aria-invalid={shown.max_cost_usd !== undefined}
            onChange={(event) => {
              setForm({ ...form, maxCost: event.target.value })
            }}
          />
          <FieldError>{shown.max_cost_usd}</FieldError>
        </Field>

        {fields.map((field) => {
          const problem = shown[`parameters.${field.key}`]
          return (
            <Field key={field.key} data-invalid={problem !== undefined}>
              <FieldLabel htmlFor={`parameter-${field.key}`}>{field.label}</FieldLabel>
              <Input
                id={`parameter-${field.key}`}
                inputMode={field.kind === 'number' ? 'numeric' : undefined}
                placeholder={
                  scalarText(field.default) === '' ? '' : `Default ${scalarText(field.default)}`
                }
                value={form.parameters[field.key] ?? ''}
                aria-invalid={problem !== undefined}
                onChange={(event) => {
                  setParameter(field.key, event.target.value)
                }}
              />
              {field.description !== undefined && (
                <FieldDescription>{field.description}</FieldDescription>
              )}
              <FieldError>{problem}</FieldError>
            </Field>
          )
        })}
      </FieldGroup>
      <SaveBar
        pending={update.isPending}
        error={formErrorMessage(update.error)}
        saved={update.isSuccess}
      />
    </form>
  )
}
