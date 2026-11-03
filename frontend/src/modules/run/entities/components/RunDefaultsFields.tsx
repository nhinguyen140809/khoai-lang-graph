'use client'

import { useId } from 'react'
import type { Control, FieldPath, FieldValues } from 'react-hook-form'

import type { ReviewableCheckpoint, RunParameterField } from '@/modules/workflow/entities/@x/run'
import { FormFieldSet, NumberField } from '@/shared/components/form'
import { Checkbox } from '@/shared/components/ui/checkbox'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/shared/components/ui/field'
import { Switch } from '@/shared/components/ui/switch'

import { runDefaultsMessages } from '../config/run-defaults.constants'
import { selectedCheckpoints, toggledCheckpoints } from '../config/run-defaults.utils'
import { ParameterField } from './ParameterField'

interface RunDefaultsFieldsProps<T extends FieldValues, TOutput = T> {
  /** The control of the form that holds the fields of the run settings. */
  control: Control<T, unknown, TOutput>
  /** The path of the fields of the run settings in the values of the form; the root without it. */
  path?: string | undefined
  /** What the fields are, for screen readers: the form shows its own heading over them. */
  legend: string
  /** The reviews that a run may pause at, as `useRunSettingsOptions` gives them. */
  checkpoints: ReviewableCheckpoint[]
  /**
   * The fields of the run parameters, as `useRunSettingsOptions` gives them: the same that the
   * schema of the form checks.
   */
  parameterFields: RunParameterField[]
}

/** The name of a field of the run settings in the values of the form. */
function nameAt<T extends FieldValues>(path: string | undefined, field: string): FieldPath<T> {
  return (path === undefined ? field : `${path}.${field}`) as FieldPath<T>
}

interface CheckpointsFieldProps<T extends FieldValues, TOutput> {
  control: Control<T, unknown, TOutput>
  name: FieldPath<T>
  checkpoints: ReviewableCheckpoint[]
}

/** The reviews that pause a run: the default of the next level, or the ones that are checked. */
function CheckpointsField<T extends FieldValues, TOutput>({
  control,
  name,
  checkpoints,
}: CheckpointsFieldProps<T, TOutput>) {
  const baseId = useId()
  return (
    <FormFieldSet
      control={control}
      name={name}
      legend={runDefaultsMessages.checkpointsLegend}
      action={(field) => (
        <Field orientation="horizontal" className="w-auto">
          <FieldLabel htmlFor={`${baseId}-default`}>{runDefaultsMessages.defaultChoice}</FieldLabel>
          <Switch
            id={`${baseId}-default`}
            size="sm"
            checked={selectedCheckpoints(field.value) === null}
            onCheckedChange={(isChecked) => {
              field.onChange(isChecked ? null : [])
            }}
          />
        </Field>
      )}
    >
      {(field) => {
        const selected = selectedCheckpoints(field.value)
        return checkpoints.map(({ id, title, description }) => (
          <Field key={id} orientation="horizontal" data-disabled={selected === null}>
            <Checkbox
              id={`${baseId}-${id}`}
              disabled={selected === null}
              checked={selected?.includes(id) === true}
              onCheckedChange={(isChecked) => {
                field.onChange(toggledCheckpoints(selected, id, isChecked === true))
              }}
            />
            <FieldContent>
              <FieldLabel htmlFor={`${baseId}-${id}`}>{title}</FieldLabel>
              <FieldDescription>{description}</FieldDescription>
            </FieldContent>
          </Field>
        ))
      }}
    </FormFieldSet>
  )
}

/**
 * The fields of the run settings, without a submit: the reviews that pause a run, its limits, and
 * the parameters of the workflow. They go inside the form of the feature that saves them.
 */
export function RunDefaultsFields<T extends FieldValues, TOutput = T>({
  control,
  path,
  legend,
  checkpoints,
  parameterFields,
}: RunDefaultsFieldsProps<T, TOutput>) {
  return (
    <FieldSet>
      <FieldLegend className="sr-only">{legend}</FieldLegend>
      <FieldDescription>{runDefaultsMessages.appliesNote}</FieldDescription>
      <CheckpointsField
        control={control}
        name={nameAt<T>(path, 'review_checkpoints')}
        checkpoints={checkpoints}
      />
      <NumberField
        control={control}
        name={nameAt<T>(path, 'max_steps')}
        label={runDefaultsMessages.maxSteps}
        min={1}
        integer
      />
      <NumberField
        control={control}
        name={nameAt<T>(path, 'max_cost_usd')}
        label={runDefaultsMessages.maxCostUsd}
        min={0}
      />
      {parameterFields.length > 0 && (
        <FieldSet>
          <FieldLegend variant="label">{runDefaultsMessages.parametersLegend}</FieldLegend>
          {parameterFields.map((field) => (
            <ParameterField
              key={field.name}
              control={control}
              name={nameAt<T>(path, `parameters.${field.name}`)}
              field={field}
            />
          ))}
        </FieldSet>
      )}
    </FieldSet>
  )
}
