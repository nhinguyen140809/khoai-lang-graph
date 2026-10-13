'use client'

import { useMemo } from 'react'

import { Checkbox } from '@/shared/components/ui/checkbox'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/shared/components/ui/field'
import { Input } from '@/shared/components/ui/input'

import type { RunConfigDefinition } from './run-config.types'
import { parameterFields, type RunForm, scalarText } from './run-form.utils'

interface RunConfigFieldsProps {
  definition: RunConfigDefinition
  form: RunForm
  onChange: (form: RunForm) => void
  /** The problems by field: `max_steps`, `max_cost_usd`, `review_checkpoints`, `parameters.<key>`. */
  problems: Record<string, string>
  /** The label of the choice that leaves the checkpoints to the next level, such as "Use my default". */
  defaultLabel: string
}

/** The fields of the run settings: the checkpoints to review at, the limits and the parameters. */
export function RunConfigFields({
  definition,
  form,
  onChange,
  problems,
  defaultLabel,
}: RunConfigFieldsProps) {
  const fields = useMemo(() => parameterFields(definition), [definition])
  const checkpoints = useMemo(
    () => definition.nodes.filter(({ kind }) => kind === 'checkpoint'),
    [definition.nodes],
  )

  return (
    <FieldGroup>
      <FieldSet>
        <FieldLegend variant="label">Review at</FieldLegend>
        <Field orientation="horizontal">
          <Checkbox
            id="checkpoints-default"
            checked={form.checkpoints === null}
            onCheckedChange={(checked) => {
              onChange({
                ...form,
                checkpoints: checked === true ? null : checkpoints.map(({ id }) => id),
              })
            }}
          />
          <FieldLabel htmlFor="checkpoints-default">{defaultLabel}</FieldLabel>
        </Field>
        {checkpoints.map((node) => (
          <Field key={node.id} orientation="horizontal">
            <Checkbox
              id={`checkpoint-${node.id}`}
              disabled={form.checkpoints === null}
              checked={form.checkpoints?.includes(node.id) ?? false}
              onCheckedChange={(checked) => {
                const current = form.checkpoints ?? []
                onChange({
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
        <FieldError>{problems.review_checkpoints}</FieldError>
      </FieldSet>

      <Field data-invalid={problems.max_steps !== undefined}>
        <FieldLabel htmlFor="max-steps">Max steps</FieldLabel>
        <Input
          id="max-steps"
          inputMode="numeric"
          value={form.maxSteps}
          aria-invalid={problems.max_steps !== undefined}
          onChange={(event) => {
            onChange({ ...form, maxSteps: event.target.value })
          }}
        />
        <FieldError>{problems.max_steps}</FieldError>
      </Field>
      <Field data-invalid={problems.max_cost_usd !== undefined}>
        <FieldLabel htmlFor="max-cost">Max cost (USD)</FieldLabel>
        <Input
          id="max-cost"
          inputMode="decimal"
          value={form.maxCost}
          aria-invalid={problems.max_cost_usd !== undefined}
          onChange={(event) => {
            onChange({ ...form, maxCost: event.target.value })
          }}
        />
        <FieldError>{problems.max_cost_usd}</FieldError>
      </Field>

      {fields.map((field) => {
        const problem = problems[`parameters.${field.key}`]
        const defaultText = scalarText(field.default)
        return (
          <Field key={field.key} data-invalid={problem !== undefined}>
            <FieldLabel htmlFor={`parameter-${field.key}`}>{field.label}</FieldLabel>
            <Input
              id={`parameter-${field.key}`}
              inputMode={field.kind === 'number' ? 'numeric' : undefined}
              placeholder={defaultText === '' ? '' : `Default ${defaultText}`}
              value={form.parameters[field.key] ?? ''}
              aria-invalid={problem !== undefined}
              onChange={(event) => {
                onChange({
                  ...form,
                  parameters: { ...form.parameters, [field.key]: event.target.value },
                })
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
  )
}
