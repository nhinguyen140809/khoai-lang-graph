import type { CommandRecord } from './command-history.store'
import type { Message, SessionRun, SessionStep } from './session.types'

/**
 * One event of the log, before it is drawn. Every event but a day mark has a time, and the log
 * prints each as `time  kind  text`.
 */
export type LogEvent =
  /** The date that the events below it happened on, printed when the date changes. */
  | { kind: 'day'; id: string; date: string }
  /** What the user typed to start a run. */
  | { kind: 'input'; id: string; time: number; text: string }
  /** A command that the user ran. */
  | { kind: 'command'; id: string; time: number; name: CommandRecord['name'] }
  | { kind: 'run-start'; id: string; time: number; run: SessionRun; retryOf: SessionRun | null }
  | { kind: 'step'; id: string; time: number; step: SessionStep }
  /** Consecutive steps on the same subject, such as the turns of one interview. */
  | {
      kind: 'group'
      id: string
      time: number
      label: string
      steps: SessionStep[]
      durationMs: number
    }
  /** A run that ended. */
  | { kind: 'run-end'; id: string; time: number; run: SessionRun }

type TimedEvent = Exclude<LogEvent, { kind: 'day' }>

// Orders events of the same time: what the user typed, the run starting, steps, the run ending.
const RANK = { input: 0, command: 0, 'run-start': 1, step: 2, group: 2, 'run-end': 3 } as const

/** Steps with the same subject and stage next to each other become one group. */
function groupSteps(steps: SessionStep[]): (SessionStep | SessionStep[])[] {
  const result: (SessionStep | SessionStep[])[] = []
  for (const step of steps) {
    const last = result.at(-1)
    const previous = Array.isArray(last) ? last.at(-1) : last
    const sameSubject =
      step.subject_item_id !== null &&
      previous?.subject_item_id === step.subject_item_id &&
      previous.stage === step.stage
    if (sameSubject && last !== undefined) {
      result[result.length - 1] = Array.isArray(last) ? [...last, step] : [last, step]
    } else {
      result.push(step)
    }
  }
  return result
}

/** The id of the element of an event in the page, for the navigation to it. */
export function eventDomId(eventId: string): string {
  return `event-${eventId}`
}

/** How long a step took when it is not finished: the time since it started. */
export function stepDurationMs(step: SessionStep, now: number): number {
  if (step.finished_at !== null) return step.usage.duration_ms
  return Math.max(0, now - Date.parse(step.started_at))
}

/** A duration as `m:ss`, or `h:mm:ss` from an hour on. */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000))
  const seconds = String(total % 60).padStart(2, '0')
  const minutes = Math.floor(total / 60)
  if (minutes < 60) return `${String(minutes)}:${seconds}`
  return `${String(Math.floor(minutes / 60))}:${String(minutes % 60).padStart(2, '0')}:${seconds}`
}

const two = (n: number) => String(n).padStart(2, '0')

/** The time of an event as `hh:mm:ss` on the clock of the user. */
export function formatClock(time: number): string {
  const date = new Date(time)
  return `${two(date.getHours())}:${two(date.getMinutes())}:${two(date.getSeconds())}`
}

/** The date of an event as `yyyy-mm-dd` on the clock of the user. */
export function formatDay(time: number): string {
  const date = new Date(time)
  return `${String(date.getFullYear())}-${two(date.getMonth() + 1)}-${two(date.getDate())}`
}

interface EventLogInput {
  /** Only the messages of the user are events; the rest are left out. */
  messages: Message[]
  /** The commands that the user ran in this session. */
  commands?: CommandRecord[] | undefined
  /** Runs in any order. */
  runs: SessionRun[]
  /** The steps of each run by run id. */
  stepsByRun: Record<string, SessionStep[] | undefined>
}

/**
 * The event log, oldest event first: what the user typed, and the start, the steps and the end of
 * every run, in the order they happened. Consecutive steps on one subject are one group, and a
 * mark for the date comes before the first event of each day.
 */
export function buildEventLog({
  messages,
  commands = [],
  runs,
  stepsByRun,
}: EventLogInput): LogEvent[] {
  const events: TimedEvent[] = []

  for (const command of commands) {
    events.push({ kind: 'command', id: command.id, time: command.time, name: command.name })
  }

  for (const message of messages) {
    if (message.author !== 'user') continue
    events.push({
      kind: 'input',
      id: message.id,
      time: Date.parse(message.created_at),
      text: message.content,
    })
  }

  for (const run of runs) {
    const steps = (stepsByRun[run.id] ?? []).toSorted((a, b) => a.sequence - b.sequence)
    const firstStep = steps[0]
    const lastStep = steps.at(-1)
    const start =
      run.started_at === null
        ? firstStep === undefined
          ? 0
          : Date.parse(firstStep.started_at)
        : Date.parse(run.started_at)

    events.push({
      kind: 'run-start',
      id: `start-${run.id}`,
      time: start,
      run,
      retryOf: runs.find(({ id }) => id === run.retry_of_run_id) ?? null,
    })

    for (const entry of groupSteps(steps)) {
      if (Array.isArray(entry)) {
        const first = entry[0]
        if (first === undefined) continue
        events.push({
          kind: 'group',
          id: `group-${first.id}`,
          time: Date.parse(first.started_at),
          label: first.stage,
          steps: entry,
          durationMs: entry.reduce((sum, step) => sum + step.usage.duration_ms, 0),
        })
      } else {
        events.push({
          kind: 'step',
          id: entry.id,
          time: Date.parse(entry.started_at),
          step: entry,
        })
      }
    }

    const ended =
      run.status === 'succeeded' || run.status === 'failed' || run.status === 'cancelled'
    if (ended) {
      events.push({
        kind: 'run-end',
        id: `end-${run.id}`,
        time:
          run.finished_at !== null
            ? Date.parse(run.finished_at)
            : Date.parse(
                lastStep?.finished_at ?? lastStep?.started_at ?? new Date(start).toISOString(),
              ),
        run,
      })
    }
  }

  const sorted = events.toSorted((a, b) => a.time - b.time || RANK[a.kind] - RANK[b.kind])
  const log: LogEvent[] = []
  let day = ''
  for (const event of sorted) {
    const eventDay = formatDay(event.time)
    if (eventDay !== day) {
      day = eventDay
      log.push({ kind: 'day', id: `day-${eventDay}`, date: eventDay })
    }
    log.push(event)
  }
  return log
}
