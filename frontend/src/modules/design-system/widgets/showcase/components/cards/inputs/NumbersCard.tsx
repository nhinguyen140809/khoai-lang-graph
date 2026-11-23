'use client'

import { useState } from 'react'

import { NumberInput } from '@/shared/components/form'
import { Field, FieldError, FieldLabel } from '@/shared/components/ui/field'

import { SampleCard, SampleLabel } from '../Sample'

interface NumberSampleProps {
  label: string
  /** The props that shape the input, written as a caption. */
  caption: string
  initial: number | null
  min?: number
  max?: number
  step?: number
  integer?: boolean
  placeholder?: string
  disabled?: boolean
  readOnly?: boolean
  /** The message of the schema, shown under an input that is invalid. */
  error?: string
}

function NumberSample({ label, caption, initial, error, ...props }: NumberSampleProps) {
  const [value, setValue] = useState(initial)
  const id = `numbers-${label.toLowerCase().replaceAll(/[^a-z]+/g, '-')}`
  return (
    <Field data-invalid={error !== undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <NumberInput
        {...props}
        id={id}
        value={value}
        onValueChange={setValue}
        aria-invalid={error !== undefined}
      />
      {error === undefined ? (
        <SampleLabel>{caption}</SampleLabel>
      ) : (
        <FieldError>{error}</FieldError>
      )}
    </Field>
  )
}

export function NumbersCard() {
  return (
    <SampleCard
      title="Number inputs"
      description="Arrows, Up and Down, Shift or Page Up and Page Down for ten steps, Home and End for the limits."
      className="grid grid-cols-2 gap-4"
    >
      <NumberSample label="Personas" caption="min 0, integer" initial={5} min={0} integer />
      <NumberSample
        label="Rounds"
        caption="min 1, max 10, integer"
        initial={3}
        min={1}
        max={10}
        integer
      />
      <NumberSample label="Offset" caption="integer, any sign" initial={-2} integer />
      <NumberSample label="Max cost" caption="min 0, step 0.01" initial={2.5} min={0} step={0.01} />
      <NumberSample
        label="Threshold"
        caption="-10 to 10, step 0.5"
        initial={-1.5}
        min={-10}
        max={10}
        step={0.5}
      />
      <NumberSample
        label="Share (%)"
        caption="0 to 100, step 5, at its maximum"
        initial={100}
        min={0}
        max={100}
        step={5}
        integer
      />
      <NumberSample
        label="Empty"
        caption="empty, with a hint"
        initial={null}
        placeholder="e.g. 4"
        min={0}
        integer
      />
      <NumberSample
        label="Budget"
        caption="invalid"
        initial={55}
        min={0}
        max={20}
        integer
        error="Use at most 20."
      />
      <NumberSample label="Locked" caption="disabled" initial={4} disabled />
      <NumberSample label="Fixed" caption="read-only" initial={7} readOnly />
    </SampleCard>
  )
}
