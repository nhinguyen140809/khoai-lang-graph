'use client'

import { RotateCcwIcon } from 'lucide-react'

import type { Run, RunStep } from '@/modules/run/entities'
import { useLatestRun } from '@/modules/run/entities'
import { Button } from '@/shared/components/ui/button'
import { Spinner } from '@/shared/components/ui/spinner'

import { useRetryRun } from '../hooks/useRetryRun'
import { retryRunMessages } from '../retry-run.constants'
import { retryableStep } from '../retry-run.utils'

interface RetryRunButtonProps {
  run: Run
  /** The steps of the line of work that failed, from which the step to start again from is read. */
  steps: readonly RunStep[]
}

/**
 * Runs a failed phase again: a new run starts from the step that failed, and the steps before it
 * are not run again. It renders nothing while the run has not ended, when no step failed, and
 * once a newer run of the thread exists, since the work has moved on from the one that failed.
 */
export function RetryRunButton({ run, steps }: RetryRunButtonProps) {
  const retry = useRetryRun()
  const step = retryableStep(run, steps)
  const latest = useLatestRun(run.thread_id, { isEnabled: step !== null })

  if (step === null || latest.data?.id !== run.id) return null

  return (
    <Button
      type="button"
      variant="ghost"
      size="xs"
      aria-label={retryRunMessages.label}
      disabled={retry.isPending}
      onClick={() => {
        retry.mutate({ runId: run.id, stepId: step.id })
      }}
    >
      {retry.isPending ? <Spinner aria-hidden /> : <RotateCcwIcon aria-hidden />}
      {retryRunMessages.retry}
    </Button>
  )
}
