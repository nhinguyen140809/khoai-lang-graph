'use client'

import { cn } from 'cn'
import type { ReactNode } from 'react'

import { AnimatedSize, Presence, usePresence } from '@/shared/components/animation'
import { useDictationContext } from '@/shared/components/dictation'
import { InputGroup, InputGroupAddon, InputGroupTextarea } from '@/shared/components/ui/input-group'
import { motionMs } from '@/shared/lib/animation'
import { isSubmitKey } from '@/shared/lib/hotkey'

import {
  usePromptField,
  usePromptLooks,
  usePromptSubmit,
  usePromptText,
} from '../hooks/usePromptInput'

interface PromptBoxProps {
  /** What stands behind the box, such as a light: the box is over it, so only what goes past its edges shows. */
  behind?: ReactNode
  children: ReactNode
}

/**
 * The box of the prompt: the fill of a card and a line a little thicker than the others, so that it
 * stands out, where other inputs have neither. Its parts are the `PromptAttachments`, the
 * `PromptTextarea` and the `PromptBar`.
 */
export function PromptBox({ behind, children }: PromptBoxProps) {
  const { looks } = usePromptLooks()

  return (
    <div className="relative">
      {behind}
      <InputGroup thickness="medium" className={cn(looks.corner, 'bg-card dark:bg-card')}>
        {children}
      </InputGroup>
    </div>
  )
}

interface PromptAttachmentsProps {
  /** Whether there is anything to show; the room for it grows and shrinks over a short time. */
  isPresent: boolean
  /** What stands above the text inside the box, such as the files that were added. */
  children: ReactNode
}

/**
 * The files above the text, in a room that grows and shrinks in height while the files fade in it,
 * so that the box does not change at once. It names its place only while it holds them, so that the
 * group puts it over the text then and keeps its own layout otherwise.
 */
export function PromptAttachments({ isPresent, children }: PromptAttachmentsProps) {
  const { looks } = usePromptLooks()
  // The room stays until the fade and the shrinking have played.
  const isShown = usePresence(isPresent, motionMs * 2)

  return (
    <AnimatedSize
      axis="height"
      {...(isShown && { 'data-align': 'block-start' })}
      className={cn('w-full', !isShown && 'hidden')}
    >
      <Presence present={isPresent} variant="top">
        <InputGroupAddon align="block-start" className={looks.trayPadding}>
          {children}
        </InputGroupAddon>
      </Presence>
    </AnimatedSize>
  )
}

/** The text of the prompt. Enter sends it, and while the prompt listens what is heard goes into it. */
export function PromptTextarea({ placeholder }: { placeholder: string }) {
  const { labelledBy, label, keysId, inputRef } = usePromptField()
  const { value, onValueChange } = usePromptText()
  const { submit } = usePromptSubmit()
  const { looks } = usePromptLooks()
  const dictation = useDictationContext()

  return (
    <InputGroupTextarea
      ref={inputRef}
      aria-labelledby={labelledBy}
      aria-label={label}
      aria-describedby={keysId}
      value={value}
      rows={looks.rows}
      // What is heard goes into the text, so typing would be overwritten by it.
      readOnly={dictation?.isListening === true}
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
