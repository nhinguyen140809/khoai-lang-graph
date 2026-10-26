'use client'

import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/shared/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/shared/components/ui/input-group'
import type { NumberLimits } from '@/shared/lib/numbers'

import { useNumberDraft } from './hooks/useNumberDraft'
import { canStep, keyAction, stepNumber, stepTimesOf } from './number-input.utils'

interface NumberInputProps
  extends
    Omit<
      React.ComponentProps<'input'>,
      'value' | 'defaultValue' | 'onChange' | 'type' | 'min' | 'max' | 'step' | 'inputMode'
    >,
    NumberLimits {
  /** The number, or null while the input is empty or holds only a sign or a point. */
  value: number | null
  onValueChange: (value: number | null) => void
  /** The size of one step of the arrows and of the keys. */
  step?: number
  /** The number is whole: the input takes no decimal point. */
  integer?: boolean
}

/**
 * An input for a number, with arrows that step it up and down. `min`, `max`, `step` and `integer`
 * shape what can be typed and where the steps stop; they never clamp what the user typed, so the
 * schema of the form still says what is wrong with a value outside its limits.
 *
 * The keys: Up and Down step, with Shift or with Page Up and Page Down ten steps at once, Home and
 * End go to `min` and `max`. The input holds the text as typed ("1." while the user is on the way
 * to "1.5") and writes it in full on blur.
 */
function NumberInput({
  value,
  onValueChange,
  min,
  max,
  step = 1,
  integer = false,
  disabled,
  readOnly,
  onBlur,
  onKeyDown,
  ...props
}: NumberInputProps) {
  const isSigned = min === undefined || min < 0
  const number = useNumberDraft(value, onValueChange, { signed: isSigned, integer })

  const isLocked = disabled === true || readOnly === true
  const limits = { min, max }
  const stepBy = (direction: 1 | -1, times: number) => {
    number.set(stepNumber(value, { direction, step, times, ...limits }))
  }

  const stepOrJump = (event: React.KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event)
    if (event.defaultPrevented || isLocked) return
    const action = keyAction(event.key, event.shiftKey)
    if (action === null) return
    event.preventDefault()
    if (action.kind === 'step') stepBy(action.direction, action.times)
    else {
      const limit = action.edge === 'min' ? min : max
      if (limit !== undefined) number.set(limit)
    }
  }

  return (
    <InputGroup data-slot="number-input">
      <InputGroupInput
        {...props}
        role="spinbutton"
        inputMode={integer ? 'numeric' : 'decimal'}
        autoComplete="off"
        aria-valuenow={value ?? undefined}
        aria-valuemin={min}
        aria-valuemax={max}
        disabled={disabled}
        readOnly={readOnly}
        value={number.draft}
        onChange={(event) => {
          number.type(event.target.value)
        }}
        onBlur={(event) => {
          number.settle()
          onBlur?.(event)
        }}
        onKeyDown={stepOrJump}
      />
      <InputGroupAddon align="inline-end" className="pr-1">
        <div className="flex flex-col">
          <StepButton
            label="Increase"
            disabled={isLocked || !canStep(value, 1, limits)}
            onStep={(times) => {
              stepBy(1, times)
            }}
          >
            <ChevronUpIcon />
          </StepButton>
          <StepButton
            label="Decrease"
            disabled={isLocked || !canStep(value, -1, limits)}
            onStep={(times) => {
              stepBy(-1, times)
            }}
          >
            <ChevronDownIcon />
          </StepButton>
        </div>
      </InputGroupAddon>
    </InputGroup>
  )
}

interface StepButtonProps {
  label: string
  disabled: boolean
  onStep: (times: number) => void
  children: React.ReactNode
}

// An arrow of the input: out of the tab order, since the keys of the input step it, and it keeps the
// focus in the input when it is pressed.
function StepButton({ label, disabled, onStep, children }: StepButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      tabIndex={-1}
      aria-label={label}
      disabled={disabled}
      className="h-3.5 w-5 rounded-sm"
      onMouseDown={(event) => {
        event.preventDefault()
      }}
      onClick={(event) => {
        onStep(stepTimesOf(event.shiftKey))
      }}
    >
      {children}
    </Button>
  )
}

export { NumberInput }
