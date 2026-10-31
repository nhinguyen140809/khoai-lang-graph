'use client'

import { SquareIcon } from 'lucide-react'

import { ConfirmDialog } from '@/shared/components/ui/confirm-dialog'

import { useStopRunDialog } from '../hooks/useOpenStopRunDialog'
import { useStopRun } from '../hooks/useStopRun'
import { stopRunMessages } from '../stop-run.constants'

/**
 * Asks before stopping a run, since the step in progress is lost, and waits until the queries on
 * the screen show it stopped; a failure leaves it open. One on the screen, opened by Stop and the
 * command palette.
 */
export function StopRunDialog() {
  const { targetId, open, setOpen, closed } = useStopRunDialog()
  const stopRun = useStopRun()

  if (targetId === null) return null

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={setOpen}
      onClosed={closed}
      destructive
      icon={<SquareIcon />}
      title={stopRunMessages.title}
      description={stopRunMessages.description}
      cancelLabel={stopRunMessages.keep}
      confirmLabel={stopRunMessages.stopRun}
      onConfirm={() => stopRun.mutateAsync(targetId)}
    />
  )
}
