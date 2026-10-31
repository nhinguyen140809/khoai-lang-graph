'use client'

import { SquareIcon } from 'lucide-react'

import type { Run } from '@/modules/run/entities'
import { Button } from '@/shared/components/ui/button'

import { useOpenStopRunDialog } from '../hooks/useOpenStopRunDialog'
import { stopRunMessages } from '../stop-run.constants'
import { stoppableRun } from '../stop-run.utils'

/**
 * Stops the given run, after asking in the one Stop dialog, which the command palette opens too.
 * It renders nothing without a run, and once the run has finished. A soft fill, so that it stays
 * below what it stands beside.
 */
export function StopRunButton({ run }: { run: Run | null }) {
  const openDialog = useOpenStopRunDialog()
  const stoppable = stoppableRun(run)

  if (stoppable === null) return null

  return (
    // The fill runs under the transparent border, as the fill of a badge does, so that a badge
    // beside it is as high; a button keeps its fill inside the border otherwise, 2px lower.
    <Button
      variant="soft"
      color="destructive"
      size="xs"
      className="shrink-0 bg-clip-border"
      onClick={() => {
        openDialog(stoppable.id)
      }}
    >
      <SquareIcon aria-hidden />
      {stopRunMessages.stop}
    </Button>
  )
}
