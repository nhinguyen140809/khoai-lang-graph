'use client'

import { LoaderCircleIcon } from 'lucide-react'
import { Streamdown } from 'streamdown'

import { useRunStream } from '../hooks/useRunStream'

interface AssistantMessageProps {
  runId: string
}

export function AssistantMessage({ runId }: AssistantMessageProps) {
  const run = useRunStream(runId)

  return (
    <div className="flex flex-col gap-2">
      {run.activeNode !== null && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <LoaderCircleIcon className="size-3 animate-spin" aria-hidden />
          Running <span className="font-mono">{run.activeNode}</span>
        </p>
      )}
      {/* Streamdown renders Markdown safely while tokens are still arriving. */}
      <Streamdown>{run.text}</Streamdown>
      {run.error !== null && (
        <p role="alert" className="text-sm text-destructive">
          {run.error}
        </p>
      )}
    </div>
  )
}
