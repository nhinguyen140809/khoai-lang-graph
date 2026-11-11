'use client'

import type { WorkEntry } from '@/modules/run/entities'
import { useWorkWords } from '@/modules/run/entities'
import { TraceLine, TraceTitle } from '@/shared/components/ui/trace'

import { useRunActivity } from '../hooks/useRunActivity'

/** How a phase failed, as the last item under it, in the colour of an error. */
export function FailureEntryView({ work }: { work: WorkEntry }) {
  const { run } = useRunActivity()
  const words = useWorkWords(work, run)
  return (
    <TraceLine status="error">
      <TraceTitle className="whitespace-normal">{words.failure}</TraceTitle>
    </TraceLine>
  )
}
