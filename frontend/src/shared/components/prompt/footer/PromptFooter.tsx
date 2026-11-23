'use client'

import { cn } from 'cn'
import type { ReactNode } from 'react'

import { Stack } from '@/shared/components/ui/stack'

import { usePromptLooks } from '../hooks/usePromptInput'

/** The row under the box, padded as the size of the prompt says so that its sides line up with the inside of the box, whose two sides hold what the place adds: `PromptFooterStart` and `PromptFooterEnd`. */
export function PromptFooter({ children }: { children: ReactNode }) {
  const { looks } = usePromptLooks()

  return (
    <div
      // The row is there only while one of its sides holds something: with nothing to show, such
      // as no dictation in this browser and nothing from the place, it takes no room under the box.
      className={cn(
        'hidden h-7 items-center gap-2 text-xs text-muted-foreground has-[>:not(:empty)]:flex',
        looks.footerPadding,
      )}
    >
      {children}
    </div>
  )
}

/** The items at the start of the row under the box, such as the settings of the work that the prompt starts. They take the free width, and what does not fit is cut. */
export function PromptFooterStart({ children }: { children: ReactNode }) {
  return (
    <Stack direction="row" gap="1" className="min-w-0 flex-1 overflow-hidden">
      {children}
    </Stack>
  )
}

/** The items at the end of the row under the box, such as a menu to add to the text and the dictation; they keep their width, and stand at the end with no start before them. */
export function PromptFooterEnd({ children }: { children: ReactNode }) {
  return (
    <Stack direction="row" gap="1" className="ml-auto shrink-0">
      {children}
    </Stack>
  )
}
