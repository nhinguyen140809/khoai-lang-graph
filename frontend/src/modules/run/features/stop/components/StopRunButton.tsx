'use client'

import { SquareIcon } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { ConfirmDialog } from '@/shared/components/ui/confirm-dialog'

import { useStopRun } from '../hooks/useStopRun'
import { useStopRunDialog } from '../hooks/useStopRunDialog'
import { stopRunMessages } from '../stop-run.constants'

/**
 * Stops the run that the status shows, after asking, in the one dialog of Stop, which the command
 * palette opens too. A soft fill, so that it stays below the status.
 */
export function StopRunButton({ runId }: { runId: string }) {
  // The dialog leaves with the button once the status shows that the run stopped.
  const { runId: asking, ask, close } = useStopRunDialog()

  return (
    <>
      {/* The fill runs under the transparent border, as the fill of the status does, so that both
          are as high; a button keeps its fill inside the border otherwise, 2px lower. */}
      <Button
        variant="soft"
        color="destructive"
        size="xs"
        className="shrink-0 bg-clip-border"
        onClick={() => {
          ask(runId)
        }}
      >
        <SquareIcon aria-hidden />
        {stopRunMessages.stop}
      </Button>
      <StopRunDialog
        runId={runId}
        open={asking === runId}
        onOpenChange={(open) => {
          if (open) ask(runId)
          else close()
        }}
      />
    </>
  )
}

interface StopRunDialogProps {
  runId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Asks before stopping a run, since the step in progress is lost, and waits until the status shows
 * it stopped; a failure leaves it open.
 */
function StopRunDialog({ runId, open, onOpenChange }: StopRunDialogProps) {
  const stopRun = useStopRun()

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      destructive
      icon={<SquareIcon />}
      title={stopRunMessages.title}
      description={stopRunMessages.description}
      cancelLabel={stopRunMessages.keep}
      confirmLabel={stopRunMessages.stopRun}
      onConfirm={() => stopRun.mutateAsync(runId)}
    />
  )
}
