'use client'

import Link from 'next/link'
import { useState } from 'react'

import { cn } from '@/lib/utils'

import type { ConsoleStep } from '../console.types'
import {
  eventDomId,
  formatClock,
  formatDuration,
  type LogEvent,
  stepDurationMs,
} from '../event-log.utils'
import { EventRow } from './EventRow'

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

/** One event of the log, printed as the rows of a table: time, kind, what happened, duration. */
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
        <EventRow id={eventDomId(event.id)} time={formatClock(event.time)} kind="input">
          {event.text}
        </EventRow>
      )
    case 'command':
      return (
        <EventRow id={eventDomId(event.id)} time={formatClock(event.time)} kind="command">
          /{event.name}
        </EventRow>
      )
    case 'run-start':
      return (
        <EventRow time={formatClock(event.time)} kind="run">
          Run {event.run.number} started
          {event.retryOf !== null && `, retrying run ${String(event.retryOf.number)}`}
        </EventRow>
      )
    case 'step':
      return (
        <StepRows
          step={event.step}
          time={event.time}
          durationMs={stepDurationMs(event.step, now)}
          projectId={projectId}
        />
      )
    case 'group':
      return <GroupRows event={event} projectId={projectId} expandAll={expandAll} now={now} />
    case 'run-end':
      return (
        <EventRow
          time={formatClock(event.time)}
          kind="run"
          tone={event.run.status === 'succeeded' ? 'success' : 'failure'}
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
          href={`/projects/${encodeURIComponent(projectId)}/search/${encodeURIComponent(item.item_id)}`}
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
  time: number
  durationMs: number
  projectId: string
}

function StepRows({ step, time, durationMs, projectId }: StepRowsProps) {
  const failed = step.status === 'failed'
  const running = step.status === 'running'
  // A step that no agent runs, such as a review checkpoint, waits for the user while it runs.
  const waiting = running && step.agent_role === null
  return (
    <>
      <EventRow
        time={formatClock(time)}
        kind="step"
        tone={failed ? 'failure' : 'default'}
        trailing={
          waiting ? (
            <span className="animate-pulse text-warning-strong" role="status">
              waiting
            </span>
          ) : running ? (
            <span className="animate-pulse text-primary" role="status">
              running {formatDuration(durationMs)}
            </span>
          ) : (
            formatDuration(durationMs)
          )
        }
      >
        <span className={cn('font-medium', !failed && 'text-foreground')}>{step.node}</span>{' '}
        <Keys items={step.produced} projectId={projectId} />
      </EventRow>
      {failed && step.error !== null && (
        <EventRow kind="step" tone="failure" continued>
          {step.error}
        </EventRow>
      )}
    </>
  )
}

interface GroupRowsProps {
  event: Extract<LogEvent, { kind: 'group' }>
  projectId: string
  expandAll: boolean
  now: number
}

/** Steps on one subject as a single row; it opens into the steps. */
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
        time={formatClock(event.time)}
        kind="steps"
        trailing={`${running ? 'running ' : ''}${formatDuration(event.durationMs)}`}
      >
        <button
          type="button"
          aria-expanded={open}
          onClick={() => {
            setOpened(!open)
          }}
          className="rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <span className="font-medium text-foreground">{event.label}</span>{' '}
          <span className="text-muted-foreground">{event.steps.length} steps</span>
        </button>
      </EventRow>
      {!open && items.length > 0 && (
        <EventRow kind="steps" continued>
          <Keys items={items} projectId={projectId} />
        </EventRow>
      )}
      {open &&
        event.steps.map((step) => (
          <StepRows
            key={step.id}
            step={step}
            time={Date.parse(step.started_at)}
            durationMs={stepDurationMs(step, now)}
            projectId={projectId}
          />
        ))}
    </>
  )
}
