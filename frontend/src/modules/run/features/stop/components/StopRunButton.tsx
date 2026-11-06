'use client'

import { SquareIcon } from 'lucide-react'

import type { Run } from '@/modules/run/entities'
import { Button } from '@/shared/components/ui/button'

import { useOpenStopRunDialog } from '../hooks/useOpenStopRunDialog'
import { stopRunMessages } from '../stop-run.constants'
import { stoppableRun } from '../stop-run.utils'

interface StopRunButtonProps {
  run: Run | null
  /** Whether it reads as a labelled button, or as the square icon of the prompt. */
  display?: 'label' | 'icon'
}

/**
 * Stops the given run, after asking in the one Stop dialog, which the command palette opens too.
 * It renders nothing without a run, and once the run has finished. A soft fill, so that it stays
 * below what it stands beside.
 */
export function StopRunButton({ run, display = 'label' }: StopRunButtonProps) {
  const openDialog = useOpenStopRunDialog()
  const stoppable = stoppableRun(run)

  if (stoppable === null) return null
  const isIcon = display === 'icon'

  return (
    // The fill runs under the transparent border, as the fill of a badge does, so that a badge
    // beside it is as high; a button keeps its fill inside the border otherwise, 2px lower.
    <Button
      type="button"
      variant="soft"
      color="destructive"
      size={isIcon ? 'icon' : 'xs'}
      className="shrink-0 bg-clip-border"
      aria-label={isIcon ? stopRunMessages.stop : undefined}
      onClick={() => {
        openDialog(stoppable.id)
      }}
    >
      <SquareIcon aria-hidden />
      {!isIcon && stopRunMessages.stop}
    </Button>
  )
}
