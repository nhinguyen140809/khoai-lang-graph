import { expect } from '@playwright/test'

import { type ApiPage, expectOk, expectPage } from '../../shared/api'
import { test } from '../../shared/fixtures.utils'
import { idea } from './runs-backend.data'

interface StreamedEvent {
  id: number
  type: string
}

/** The events of a stream read to its end, as text: the lines `id:` and `event:` of each. */
function eventsOf(text: string): StreamedEvent[] {
  const events: StreamedEvent[] = []
  let id = 0
  for (const line of text.split('\n')) {
    if (line.startsWith('id: ')) id = Number(line.slice(4))
    if (line.startsWith('event: ')) events.push({ id, type: line.slice(7) })
  }
  return events
}

test('replays every event of a finished run once, in order, and ends with done', async ({
  api,
  client,
}) => {
  const { run } = await api.startFinishedRun(idea)

  const stream = await client.download(`/api/v1/runs/${run.id}/stream`)

  expect(stream.headers['content-type']).toContain('text/event-stream')
  const events = eventsOf(stream.body)
  const ids = events.map((event) => event.id)
  expect(ids).toEqual([...new Set(ids)].sort((a, b) => a - b))
  expect(events.at(-1)?.type).toBe('done')
  expect(events.map((event) => event.type)).toEqual(
    expect.arrayContaining(['node_start', 'node_end', 'artifact_created', 'token', 'done']),
  )
})

test('gives only the events after the one a client has seen', async ({ api, client }) => {
  const { run } = await api.startFinishedRun(idea)
  const all = eventsOf((await client.download(`/api/v1/runs/${run.id}/stream`)).body)
  const seen = all[Math.floor(all.length / 2)]?.id ?? 0

  const tail = eventsOf(
    (await client.download(`/api/v1/runs/${run.id}/stream?after=${String(seen)}`)).body,
  )

  expect(tail.length).toBeGreaterThan(0)
  expect(tail.every((event) => event.id > seen)).toBe(true)
  expect(tail.length).toBe(all.filter((event) => event.id > seen).length)
})

test('keeps the state of the run and of each step it took', async ({ api, client }) => {
  const { run } = await api.startFinishedRun(idea)
  const steps = await api.listSteps(run.id)

  expectOk(await client.get(`/runs/${run.id}/state`))
  for (const step of steps.slice(0, 3)) {
    expectOk(await client.get(`/runs/${run.id}/steps/${step.id}/state`))
  }
  expect(steps.map((step) => step.sequence)).toEqual(steps.map((_, index) => index + 1))
})

test('lists no directive for a run that nobody sent back', async ({ api, client }) => {
  const { run } = await api.startFinishedRun(idea)

  const directives = expectPage(await client.get<ApiPage<unknown>>(`/runs/${run.id}/directives`))

  expect(directives.items).toHaveLength(0)
})
