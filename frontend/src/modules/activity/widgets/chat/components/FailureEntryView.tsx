'use client'

import type { WorkEntry } from '@/modules/run/entities'
import { useWorkWords } from '@/modules/run/entities'
import { RetryRunButton } from '@/modules/run/features/retry'
import { TraceLine, TraceTitle } from '@/shared/components/ui/trace'

import { useRunActivity } from '../hooks/useRunActivity'

/**
 * How a phase failed, as the last item under it, in the colour of an error, with the button that
 * runs it again from the step that failed.
 */
export function FailureEntryView({ work }: { work: WorkEntry }) {
  const { run } = useRunActivity()
  const words = useWorkWords(work, run)
  return (
    <div className="flex min-w-0 flex-col items-start gap-2">
      <TraceLine status="error">
        <TraceTitle className="whitespace-normal">{words.failure}</TraceTitle>
      </TraceLine>
      <RetryRunButton run={run} steps={work.steps} />
    </div>
  )
}
