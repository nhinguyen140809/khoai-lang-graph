'use client'

import { useEffect, useRef } from 'react'

import { Markdown } from '@/components/ui/markdown'

import { useRunStream } from '../hooks/useRunStream'
import type { RunLogEntry } from '../run-events.reducer'

interface RunFlowProps {
  runId: string
}

/**
 * The log of one run, printed line by line the way a terminal follows a running tool: a node
 * starts with `⏺`, its details print under it with `⎿` while it works, and the run ends with a
 * mark. Inspired by Claude Code's CLI: formatted log lines, not chat bubbles.
 */
export function RunFlow({ runId }: RunFlowProps) {
  const run = useRunStream(runId)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Keep the newest line in view the way a terminal follows its own output.
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [run.entries, run.status])

  return (
    <div className="flex flex-col gap-1 font-mono text-xs leading-relaxed text-foreground">
      {run.entries.map((entry) => (
        <RunLogLine key={entry.id} entry={entry} />
      ))}
      {run.status === 'streaming' && run.entries.length === 0 && (
        <p className="text-muted-foreground">starting…</p>
      )}
      <div ref={endRef} />
    </div>
  )
}

interface RunLogLineProps {
  entry: RunLogEntry
}

/** One line of the log, with the marks of the terminal. */
function RunLogLine({ entry }: RunLogLineProps) {
  switch (entry.kind) {
    case 'node':
      return (
        <p className="flex items-baseline gap-2 pt-1 font-medium">
          <span aria-hidden>⏺</span>
          <span>{entry.node}</span>
          {entry.state === 'running' && (
            <span className="animate-pulse text-primary" aria-label="running">
              …
            </span>
          )}
        </p>
      )
    case 'text':
      return (
        <div className="flex items-start gap-2 pl-3">
          <span aria-hidden className="pt-px text-muted-foreground select-none">
            ⎿
          </span>
          <div className="min-w-0 flex-1 text-foreground">
            {/* Markdown renders safely while tokens are still arriving. */}
            <Markdown>{entry.text}</Markdown>
          </div>
        </div>
      )
    case 'tool_call':
      return (
        <p className="pl-5 text-muted-foreground">
          <span aria-hidden>⎿ </span>
          <span className="text-foreground">{entry.tool}</span>()
        </p>
      )
    case 'artifact':
      return (
        <p className="pl-5 text-muted-foreground">
          <span aria-hidden>⎿ </span>
          created <span className="text-foreground">{entry.name}</span>
          <span> · v{entry.version}</span>
        </p>
      )
    case 'interrupt':
      return (
        <p className="pt-1 text-warning-strong">
          <span aria-hidden>? </span>
          {entry.node} — waiting for review
        </p>
      )
    case 'error':
      return (
        <p role="alert" className="pt-1 text-destructive-strong">
          <span aria-hidden>✖ </span>
          {entry.message}
        </p>
      )
    case 'done':
      return (
        <p className="pt-1 text-success-strong">
          <span aria-hidden>✓ </span>
          done
        </p>
      )
  }
}
