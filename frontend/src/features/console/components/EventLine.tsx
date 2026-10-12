'use client'

import { CornerDownRightIcon } from 'lucide-react'
import Link from 'next/link'
import { type ReactNode, useState } from 'react'

import { cn } from '@/lib/utils'

import type { ConsoleStep } from '../console.types'
import { eventDomId, formatDuration, type LogEvent, stepDurationMs } from '../event-log.utils'
import { EventRow, PromptMark, type RowTone, StatusDot } from './EventRow'

interface EventLineProps {
  event: LogEvent
  projectId: string
  /** Whether groups of steps show their steps; a group can still be opened or closed alone. */
  expandAll: boolean
  /** The time that a running step is measured against. */
  now: number
}

// How many keys a row lists before it says how many more there are.
const MAX_KEYS = 3

/** One event of the log, printed as rows: a mark, what happened, and how long it took. */
export function EventLine({ event, projectId, expandAll, now }: EventLineProps) {
  switch (event.kind) {
    case 'day':
      return (
        <p className="pt-3 font-mono text-xs text-muted-foreground" role="separator">
          {event.date}
        </p>
      )
    case 'input':
      return (
        // A message stays at the top of the log while its turn is in view.
        <EventRow
          id={eventDomId(event.id)}
          mark={<PromptMark />}
          className="sticky top-0 z-10 bg-background py-1"
        >
          {event.text}
        </EventRow>
      )
    case 'command':
      return (
        <EventRow id={eventDomId(event.id)} mark={<PromptMark />}>
          /{event.name}
        </EventRow>
      )
    case 'run-start':
      return (
        <EventRow mark={<StatusDot />}>
          Run {event.run.number} started
          {event.retryOf !== null && `, retrying run ${String(event.retryOf.number)}`}
        </EventRow>
      )
    case 'step':
      return (
        <StepRows
          step={event.step}
          durationMs={stepDurationMs(event.step, now)}
          projectId={projectId}
        />
      )
    case 'group':
      return <GroupRows event={event} projectId={projectId} expandAll={expandAll} now={now} />
    case 'run-end':
      return (
        <EventRow
          mark={<StatusDot tone={event.run.status === 'succeeded' ? 'success' : 'failure'} />}
        >
          Run {event.run.number}{' '}
          {event.run.status === 'succeeded'
            ? 'done'
            : event.run.status === 'cancelled'
              ? 'stopped'
              : 'failed'}
          {event.run.error !== null && `: ${event.run.error.message}`}
        </EventRow>
      )
  }
}

interface KeysProps {
  items: ConsoleStep['produced']
  projectId: string
}

/** The keys of the items that steps produced, each a link to the item. */
function Keys({ items, projectId }: KeysProps) {
  const shown = items.slice(0, MAX_KEYS)
  const more = items.length - shown.length
  return (
    <>
      {shown.map((item) => (
        <Link
          key={item.item_id}
          href={`/projects/${encodeURIComponent(projectId)}/artifacts/items/${encodeURIComponent(item.item_id)}`}
          className="mr-2 rounded-sm text-primary underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          {item.key}
        </Link>
      ))}
      {more > 0 && <span className="text-muted-foreground">+{more}</span>}
    </>
  )
}

interface StepRowsProps {
  step: ConsoleStep
  durationMs: number
  projectId: string
}

function stepTone(step: ConsoleStep): RowTone {
  switch (step.status) {
    case 'failed':
      return 'failure'
    case 'succeeded':
      return 'success'
    case 'skipped':
      return 'default'
    case 'running':
      // A step that no agent runs, such as a review checkpoint, waits for the user while it runs.
      return step.agent_role === null ? 'warning' : 'running'
  }
}

function StepRows({ step, durationMs, projectId }: StepRowsProps) {
  const tone = stepTone(step)
  const failed = tone === 'failure'
  return (
    <>
      <EventRow
        mark={<StatusDot tone={tone} />}
        trailing={
          tone === 'warning' ? (
            <span className="text-warning-strong" role="status">
              waiting
            </span>
          ) : tone === 'running' ? (
            <span className="text-primary" role="status">
              running {formatDuration(durationMs)}
            </span>
          ) : (
            formatDuration(durationMs)
          )
        }
      >
        <span className={cn('font-medium', failed ? 'text-destructive-strong' : 'text-foreground')}>
          {step.node}
        </span>{' '}
        <Keys items={step.produced} projectId={projectId} />
      </EventRow>
      {failed && step.error !== null && (
        <EventRow>
          <span className="text-destructive-strong">{step.error}</span>
        </EventRow>
      )}
    </>
  )
}

/** Rows that belong to the row above them: set in, with a corner icon before the first one. */
function NestedRows({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-x-1 pl-4">
      <span className="flex h-lh w-4 shrink-0 items-center justify-center">
        <CornerDownRightIcon aria-hidden className="size-3.5 text-muted-foreground" />
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

// The state that stands for a group: the one that needs attention first.
const GROUP_TONES: RowTone[] = ['failure', 'warning', 'running', 'success']

function groupTone(steps: ConsoleStep[]): RowTone {
  const tones = new Set(steps.map(stepTone))
  return GROUP_TONES.find((tone) => tones.has(tone)) ?? 'default'
}

interface GroupRowsProps {
  event: Extract<LogEvent, { kind: 'group' }>
  projectId: string
  expandAll: boolean
  now: number
}

/** Steps on one subject as a single row; it opens into the steps, set in under the row. */
function GroupRows({ event, projectId, expandAll, now }: GroupRowsProps) {
  const [opened, setOpened] = useState<boolean | null>(null)
  const open = opened ?? expandAll
  const items = event.steps
    .flatMap(({ produced }) => produced)
    .filter((item, index, all) => all.findIndex(({ key }) => key === item.key) === index)
  const running = event.steps.some(({ status }) => status === 'running')

  return (
    <>
      <EventRow
        mark={<StatusDot tone={groupTone(event.steps)} />}
        trailing={`${running ? 'running ' : ''}${formatDuration(event.durationMs)}`}
      >
        {/* The button covers the whole row, so the mark and the empty space open the group too. */}
        <button
          type="button"
          aria-expanded={open}
          onClick={() => {
            setOpened(!open)
          }}
          className="text-left outline-none after:absolute after:inset-0 focus-visible:after:ring-2 focus-visible:after:ring-ring/50"
        >
          <span className="font-medium text-foreground">{event.label}</span>{' '}
          <span className="text-muted-foreground">{event.steps.length} steps</span>
        </button>
      </EventRow>
      {(open || items.length > 0) && (
        <NestedRows>
          {open ? (
            event.steps.map((step) => (
              <StepRows
                key={step.id}
                step={step}
                durationMs={stepDurationMs(step, now)}
                projectId={projectId}
              />
            ))
          ) : (
            <EventRow>
              <Keys items={items} projectId={projectId} />
            </EventRow>
          )}
        </NestedRows>
      )}
    </>
  )
}
