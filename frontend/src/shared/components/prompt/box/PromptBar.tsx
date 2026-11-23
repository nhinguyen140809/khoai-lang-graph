'use client'

import type { ReactNode } from 'react'

import { InputGroupAddon } from '@/shared/components/ui/input-group'
import { Stack } from '@/shared/components/ui/stack'

import { usePromptLooks, usePromptSubmit } from '../hooks/usePromptInput'
import { PromptSubmitButton } from './PromptSubmitButton'

/** The row of the box under the text, which the size of the prompt places: its start and its end. */
export function PromptBar({ children }: { children: ReactNode }) {
  const { looks } = usePromptLooks()

  return (
    <InputGroupAddon align={looks.addon} className={looks.addonLook}>
      {children}
    </InputGroupAddon>
  )
}

/** The items at the start of the row of the box, which take the free width; what does not fit is cut. */
export function PromptBarStart({ children }: { children: ReactNode }) {
  return (
    <Stack direction="row" gap="1" className="min-w-0 flex-1 overflow-hidden">
      {children}
    </Stack>
  )
}

/** The items at the end of the row of the box; they keep their width, and stand at the end with no start before them. */
export function PromptBarEnd({ children }: { children: ReactNode }) {
  return (
    <Stack direction="row" gap="1" className="ml-auto shrink-0">
      {children}
    </Stack>
  )
}

/** The button that sends the text of the prompt. */
export function PromptSend({ label }: { label: string }) {
  const { canSubmit, isPending } = usePromptSubmit()

  return <PromptSubmitButton submitLabel={label} isPending={isPending} isDisabled={!canSubmit} />
}
