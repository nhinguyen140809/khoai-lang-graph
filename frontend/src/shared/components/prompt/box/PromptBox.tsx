'use client'

import { cn } from 'cn'
import type { ReactNode } from 'react'

import { InputGroup, InputGroupTextarea } from '@/shared/components/ui/input-group'
import { isSubmitKey } from '@/shared/lib/hotkey'

import {
  usePromptField,
  usePromptLooks,
  usePromptSubmit,
  usePromptText,
} from '../hooks/usePromptInput'

/**
 * The box of the prompt: the fill of a card and a line a little thicker than the others, so that it
 * stands out, where other inputs have neither. Its parts are the `PromptTextarea` and the
 * `PromptBar`.
 */
export function PromptBox({ children }: { children: ReactNode }) {
  const { looks } = usePromptLooks()

  return (
    <div className="relative">
      <InputGroup thickness="medium" className={cn(looks.corner, 'bg-card dark:bg-card')}>
        {children}
      </InputGroup>
    </div>
  )
}

/** The text of the prompt. Enter sends it. */
export function PromptTextarea({ placeholder }: { placeholder: string }) {
  const { labelledBy, label, keysId, inputRef } = usePromptField()
  const { value, onValueChange } = usePromptText()
  const { submit } = usePromptSubmit()
  const { looks } = usePromptLooks()

  return (
    <InputGroupTextarea
      ref={inputRef}
      aria-labelledby={labelledBy}
      aria-label={label}
      aria-describedby={keysId}
      value={value}
      rows={looks.rows}
      placeholder={placeholder}
      onChange={(event) => {
        onValueChange(event.target.value)
      }}
      onKeyDown={(event) => {
        if (!isSubmitKey(event.nativeEvent)) return
        event.preventDefault()
        submit()
      }}
      // The height that the size gives moves, instead of jumping, when the size changes.
      className={cn(
        'max-h-48 overflow-y-auto leading-relaxed transition-all motion-reduce:transition-none',
        looks.minHeight,
        looks.textPadding,
      )}
    />
  )
}
