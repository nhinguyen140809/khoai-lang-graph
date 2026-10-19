'use client'

import { useRunStream } from '@/modules/run/entities'
import { Markdown } from '@/shared/components/ui/markdown'
import { Spinner } from '@/shared/components/ui/spinner'

import { ActivityEntry } from './ActivityEntry'
import { CopyEntryAction } from './CopyEntryAction'

interface RunEntryProps {
  runId: string
}

/** What the agents write in a run, as it streams; the mark spins while a step runs. */
export function RunEntry({ runId }: RunEntryProps) {
  const run = useRunStream(runId)

  return (
    <ActivityEntry
      author="agent"
      mark={run.activeNode === null ? undefined : <Spinner />}
      actions={run.text === '' ? undefined : <CopyEntryAction text={run.text} />}
    >
      {run.activeNode !== null && (
        <p className="text-xs text-muted-foreground">Running {run.activeNode}</p>
      )}
      {/* Markdown renders safely while tokens are still arriving. */}
      <Markdown>{run.text}</Markdown>
      {run.error !== null && (
        <p role="alert" className="text-destructive">
          {run.error}
        </p>
      )}
    </ActivityEntry>
  )
}
