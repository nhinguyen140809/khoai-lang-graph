'use client'

import { ArrowUpIcon } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { Spinner } from '@/shared/components/ui/spinner'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'

interface PromptSubmitButtonProps {
  /** The name of the button, in its tooltip and for assistive technology. */
  submitLabel: string
  /** While the text is sent: the button is disabled and spins. */
  isPending: boolean
  /** Whether the text cannot be sent, such as a blank prompt. */
  isDisabled: boolean
}

/** The button that sends the prompt: the arrow of a chat, or the spinner while it waits. */
export function PromptSubmitButton({
  submitLabel,
  isPending,
  isDisabled,
}: PromptSubmitButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="submit"
          size="icon"
          disabled={isDisabled || isPending}
          aria-label={submitLabel}
        >
          {isPending ? <Spinner /> : <ArrowUpIcon aria-hidden />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{submitLabel}</TooltipContent>
    </Tooltip>
  )
}
