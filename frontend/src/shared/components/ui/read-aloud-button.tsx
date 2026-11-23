'use client'

import { SquareIcon, Volume2Icon } from 'lucide-react'
import type * as React from 'react'

import { plainTextOf, speechLangOf, useSpeechSynthesis } from '@/shared/lib/speech'

import { Button } from './button'
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip'

interface ReadAloudButtonProps extends Omit<
  React.ComponentProps<typeof Button>,
  'children' | 'asChild'
> {
  /** The text that a click reads, as markdown or plain text. */
  value: string
  /** The words that name the button while it reads. */
  label?: string
  /** The words that name the button while it reads, which stop the reading. */
  stopLabel?: string
}

/**
 * A button that reads a text aloud with the voice of the browser, in the language that the letters
 * of the text show, and stops the reading when it
 * is pressed again. It is not drawn in a browser that has no voice. Only one text is read at a time.
 */
function ReadAloudButton({
  value,
  label = 'Read aloud',
  stopLabel = 'Stop reading',
  variant = 'ghost',
  onClick,
  ...props
}: ReadAloudButtonProps) {
  const { isSupported, isSpeaking, read, stop } = useSpeechSynthesis()
  if (!isSupported) return null
  const name = isSpeaking ? stopLabel : label

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          aria-label={name}
          aria-pressed={isSpeaking}
          variant={variant}
          color={isSpeaking ? 'primary' : undefined}
          onClick={(event) => {
            onClick?.(event)
            if (event.defaultPrevented) return
            if (isSpeaking) stop()
            else {
              const text = plainTextOf(value)
              read(text, speechLangOf(text))
            }
          }}
          {...props}
        >
          {isSpeaking ? <SquareIcon /> : <Volume2Icon />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{name}</TooltipContent>
    </Tooltip>
  )
}

export { ReadAloudButton }
