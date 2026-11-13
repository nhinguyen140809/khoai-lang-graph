'use client'

import { cn } from 'cn'
import { type KeyboardEvent, type ReactNode, type Ref, useId } from 'react'

import { InputGroup, InputGroupAddon, InputGroupTextarea } from '@/shared/components/ui/input-group'
import { Stack } from '@/shared/components/ui/stack'
import { hasText } from '@/shared/lib/guards'
import { isSubmitKey } from '@/shared/lib/hotkey'

import { promptInputLooks, type PromptInputSize } from './prompt-input.types'
import { PromptSubmitButton } from './PromptSubmitButton'

interface PromptInputProps {
  /** The id of the element that names the prompt, such as a heading above it. */
  labelledBy?: string | undefined
  /** The name of the prompt for assistive technology when nothing on screen names it. */
  label?: string | undefined
  value: string
  onValueChange: (value: string) => void
  /** Sends the text, trimmed; never called with a blank text or while `isPending`. */
  onSubmit: (text: string) => void
  /** The name of the send button, in its tooltip and for assistive technology. */
  submitLabel: string
  /** The keys, read by assistive technology only, such as "Enter to send, Shift+Enter for a new line". */
  keysHint: string
  placeholder: string
  /** While the text is sent: the button is disabled and spins. */
  isPending?: boolean | undefined
  /**
   * Three rows for a prompt that starts a project, one row that grows for the chat, and a slim
   * one whose send sits in the row of the text, for the place a review already fills.
   */
  size?: PromptInputSize | undefined
  /**
   * The items at the start of the row inside the box, beside the send button. They take the free
   * width, and what does not fit is cut, as on the status bar.
   */
  startActions?: ReactNode
  /** The items at the end of the row inside the box, send button included; the default Send without them. */
  endActions?: ReactNode
  /**
   * The items at the start of the row under the box, such as the settings of the work that the
   * prompt starts. They take the free width, and what does not fit is cut, as on the status bar.
   */
  footerStart?: ReactNode
  /** The items at the end of the row under the box; they keep their width. */
  footerEnd?: ReactNode
  inputRef?: Ref<HTMLTextAreaElement> | undefined
}

/**
 * The prompt that starts work: a box with the text and a send button, and a row under it whose
 * two sides hold what the place adds. Enter sends, Shift+Enter adds a line.
 */
export function PromptInput({
  labelledBy,
  label,
  value,
  onValueChange,
  onSubmit,
  submitLabel,
  keysHint,
  placeholder,
  isPending = false,
  size = 'comfortable',
  startActions,
  endActions,
  footerStart,
  footerEnd,
  inputRef,
}: PromptInputProps) {
  const id = useId()
  const isBlank = !hasText(value)
  const hasFooter = footerStart !== undefined || footerEnd !== undefined
  const looks = promptInputLooks[size]

  const submit = () => {
    if (!isBlank && !isPending) onSubmit(value.trim())
  }

  const submitOnEnter = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!isSubmitKey(event.nativeEvent)) return
    event.preventDefault()
    submit()
  }

  return (
    <form
      aria-labelledby={labelledBy}
      aria-label={label}
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
      className="flex flex-col gap-0"
    >
      {/* The box of the prompt keeps the fill of a card, so that it stands out, where other
          inputs have none. */}
      <InputGroup className="bg-card dark:bg-card">
        <InputGroupTextarea
          ref={inputRef}
          aria-labelledby={labelledBy}
          aria-label={label}
          aria-describedby={`${id}-keys`}
          value={value}
          rows={looks.rows}
          placeholder={placeholder}
          onChange={(event) => {
            onValueChange(event.target.value)
          }}
          onKeyDown={submitOnEnter}
          className={cn('max-h-48 overflow-y-auto leading-relaxed', looks.minHeight)}
        />
        <InputGroupAddon align={looks.addon} className={looks.addonLook}>
          {/* Only assistive technology reads the keys; on screen, the arrow sends the text. */}
          <p id={`${id}-keys`} className="sr-only">
            {keysHint}
          </p>
          <Stack direction="row" gap="1" className="min-w-0 flex-1 overflow-hidden">
            {startActions}
          </Stack>
          <Stack direction="row" gap="1" className="shrink-0">
            {endActions ?? (
              <PromptSubmitButton
                submitLabel={submitLabel}
                isPending={isPending}
                isDisabled={isBlank}
              />
            )}
          </Stack>
        </InputGroupAddon>
      </InputGroup>
      {hasFooter && (
        <div className="flex h-7 items-center gap-2 px-0 text-xs text-muted-foreground">
          <Stack direction="row" gap="1" className="min-w-0 flex-1 overflow-hidden">
            {footerStart}
          </Stack>
          <Stack direction="row" gap="1" className="shrink-0">
            {footerEnd}
          </Stack>
        </div>
      )}
    </form>
  )
}
