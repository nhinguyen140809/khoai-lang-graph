'use client'

import { useId, useMemo } from 'react'
import { Controller, useFormContext } from 'react-hook-form'

import { TextField } from '@/shared/components/form'
import { Checkbox } from '@/shared/components/ui/checkbox'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/shared/components/ui/field'

import type { RunConfigDefinition } from './run-config.types'
import { parameterFields, scalarText } from './run-form.utils'

interface RunConfigFieldsProps {
  definition: RunConfigDefinition
  /** Where the form holds the run settings, a `RunForm`, such as `run_config`. */
  name: string
  /** The label of the choice that leaves the checkpoints to the next level, such as "Use my default". */
  defaultLabel: string
}

/**
 * The fields of the run settings: the checkpoints to review at, the limits and the parameters. They
 * belong to the form around them, read with `useFormContext`, at `name`.
 */
export function RunConfigFields({ definition, name, defaultLabel }: RunConfigFieldsProps) {
  const { control } = useFormContext()
  const fields = useMemo(() => parameterFields(definition), [definition])
  const checkpoints = useMemo(
    () => definition.nodes.filter(({ kind }) => kind === 'checkpoint'),
    [definition.nodes],
  )
  const id = useId()

  return (
    <FieldGroup>
      <Controller
        control={control}
        name={`${name}.review_checkpoints`}
        render={({ field, fieldState }) => {
          const chosen = field.value as string[] | null
          return (
            <FieldSet>
              <FieldLegend variant="label">Review at</FieldLegend>
              <Field orientation="horizontal">
                <Checkbox
                  id={`${id}-default`}
                  checked={chosen === null}
                  onCheckedChange={(checked) => {
                    field.onChange(
                      checked === true ? null : checkpoints.map(({ id: node }) => node),
                    )
                  }}
                />
                <FieldLabel htmlFor={`${id}-default`}>{defaultLabel}</FieldLabel>
              </Field>
              {checkpoints.map((node) => (
                <Field key={node.id} orientation="horizontal">
                  <Checkbox
                    id={`${id}-${node.id}`}
                    disabled={chosen === null}
                    checked={chosen?.includes(node.id) ?? false}
                    onCheckedChange={(checked) => {
                      const current = chosen ?? []
                      field.onChange(
                        checked === true
                          ? [...current, node.id]
                          : current.filter((nodeId) => nodeId !== node.id),
                      )
                    }}
                  />
                  <FieldLabel htmlFor={`${id}-${node.id}`} className="font-mono">
                    {node.label}
                  </FieldLabel>
                </Field>
              ))}
              <FieldError errors={[fieldState.error]} />
            </FieldSet>
          )
        }}
      />

      <TextField
        control={control}
        name={`${name}.max_steps`}
        label="Max steps"
        inputMode="numeric"
      />
      <TextField
        control={control}
        name={`${name}.max_cost_usd`}
        label="Max cost (USD)"
        inputMode="decimal"
      />

      {fields.map((field) => {
        const defaultText = scalarText(field.default)
        return (
          <TextField
            key={field.key}
            control={control}
            name={`${name}.parameters.${field.key}`}
            label={field.label}
            description={field.description}
            inputMode={field.kind === 'number' ? 'numeric' : undefined}
            placeholder={defaultText === '' ? '' : `Default ${defaultText}`}
          />
        )
      })}
    </FieldGroup>
  )
}
