import { describe, expect, it } from 'vitest'

import { mockMessages } from '@/mocks/messages.fixtures'
import { RUN_IDS, THREAD_IDS } from '@/mocks/mock-ids.constants'
import { mockRuns, mockRunSteps } from '@/mocks/runs.fixtures'

import { buildEventLog, formatClock, formatDay, formatDuration } from '../event-log.utils'
import type { Message, SessionStep } from '../session.types'

const runs = mockRuns('waiting').filter(({ thread_id }) => thread_id === THREAD_IDS.mentorMain)
const messages = mockMessages.filter(({ thread_id }) => thread_id === THREAD_IDS.mentorMain)
const stepsByRun: Record<string, SessionStep[]> = {}
for (const { id } of runs) stepsByRun[id] = mockRunSteps(id, 'waiting')

describe('formatDuration', () => {
  it('reads minutes and seconds, and hours from sixty minutes', () => {
    expect(formatDuration(21_000)).toBe('0:21')
    expect(formatDuration(130_000)).toBe('2:10')
    expect(formatDuration(3_725_000)).toBe('1:02:05')
    expect(formatDuration(-5)).toBe('0:00')
  })
})

describe('formatClock and formatDay', () => {
  it('print the time and the date on the clock of the user', () => {
    const time = new Date(2026, 9, 2, 8, 5, 9).getTime()

    expect(formatClock(time)).toBe('08:05:09')
    expect(formatDay(time)).toBe('2026-10-02')
  })
})

describe('buildEventLog', () => {
  const log = buildEventLog({ messages, runs, stepsByRun })

  it('starts with the day, then what the user typed, then the start of the first run', () => {
    expect(log.slice(0, 3).map(({ kind }) => kind)).toEqual(['day', 'input', 'run-start'])
    const input = log[1]
    expect(input?.kind === 'input' && input.text).toContain('online platform')
  })

  it('leaves out the messages of agents', () => {
    expect(log.filter(({ kind }) => kind === 'input')).toHaveLength(
      messages.filter(({ author }) => author === 'user').length,
    )
  })

  it('marks each new day once', () => {
    const days = log.flatMap((event) => (event.kind === 'day' ? [event.date] : []))

    expect(days).toHaveLength(3)
    expect(new Set(days).size).toBe(3)
  })

  it('puts the steps of a run between its start and its end', () => {
    const start = log.findIndex(
      (event) => event.kind === 'run-start' && event.run.id === RUN_IDS.mentorMain1,
    )
    const end = log.findIndex(
      (event) => event.kind === 'run-end' && event.run.id === RUN_IDS.mentorMain1,
    )
    const secondInput = messages.filter(({ author }) => author === 'user')[1]
    const second = log.findIndex((event) => event.kind === 'input' && event.id === secondInput?.id)

    expect(start).toBeGreaterThan(0)
    expect(end).toBeGreaterThan(start)
    expect(end).toBeLessThan(second)
  })

  it('groups the turns of one interview into one event', () => {
    const groups = log.filter(
      (event) => event.kind === 'group' && event.steps[0]?.run_id === RUN_IDS.mentorMain3,
    )

    expect(groups).toHaveLength(3)
    expect(groups[0]).toMatchObject({ label: 'interviewing' })
    expect(groups[0]?.kind === 'group' && groups[0].steps).toHaveLength(24)
  })

  it('ends a finished run, names the run that a retry repeats, and leaves an unfinished run open', () => {
    const ended = log.filter((event) => event.kind === 'run-end')
    const retry = log.find((event) => event.kind === 'run-start' && event.run.number === 3)

    expect(ended.map((event) => (event as { run: { number: number } }).run.number)).toEqual([1, 2])
    expect(retry?.kind === 'run-start' && retry.retryOf?.number).toBe(2)
  })

  it('puts a command of the user among the events by its time', () => {
    const time = Date.parse('2026-10-05T12:00:00Z')

    const withCommand = buildEventLog({
      messages,
      commands: [{ id: 'command-1', name: 'stop', time }],
      runs,
      stepsByRun,
    })

    const index = withCommand.findIndex((event) => event.kind === 'command')
    expect(withCommand[index]).toMatchObject({ kind: 'command', name: 'stop' })
    expect(withCommand[index - 1]?.kind).not.toBe('command')
  })

  it('prints a message sent in the middle of a run where it was sent', () => {
    const base = messages[0]
    if (base === undefined) throw new Error('No mock message')
    const late: Message = { ...base, id: 'late', created_at: '2026-10-07T00:00:00Z' }

    const withLate = buildEventLog({ messages: [...messages, late], runs, stepsByRun })

    expect(withLate.at(-1)).toMatchObject({ kind: 'input', id: 'late' })
  })
})
