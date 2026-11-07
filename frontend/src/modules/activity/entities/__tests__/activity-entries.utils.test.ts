import { describe, expect, it } from 'vitest'

import { buildStep } from '@/mocks/runs/fixtures/runs.fixtures'
import { runIds } from '@/mocks/shared/db'
import { workEntries } from '@/modules/run/entities'
import type { Message } from '@/modules/thread/entities'

import type { ActivityEntry } from '../activity-entries.types'
import { entryAnchorId, messagesByRun, runEntries } from '../activity-entries.utils'
import {
  kindTitles,
  messages,
  run,
  stageTitles,
  steps,
  subjectTitles,
} from './activity-entries.utils.data'

function entriesOf(view: 'user' | 'developer') {
  return runEntries({
    messages,
    work: workEntries(steps, run),
    interrupts: [],
    stageTitles,
    subjectTitles,
    kindTitles,
    view,
  })
}

describe('runEntries', () => {
  it('orders the entries by their time', () => {
    const entries = entriesOf('user')

    expect(entries.map(({ type, id }) => `${type}:${id}`)).toEqual(['message:m1', 'work:s1'])
  })

  it('leaves a line of a stage the user does not see out of the user view, and keeps it in the developer view', () => {
    expect(entriesOf('user').map(({ type }) => type)).toEqual(['message', 'work'])
    expect(entriesOf('developer').map(({ type }) => type)).toEqual(['message', 'work', 'work'])
  })

  it('gives each line of work the titles of its stage, its subject and what it wrote', () => {
    const entries = entriesOf('user')
    const first = entries.find(({ type }) => type === 'work') as Extract<
      ActivityEntry,
      { type: 'work' }
    >

    expect(first.stageTitle).toBe('Planning the interviews')
    expect(first.subjectTitle).toBeNull()
  })

  it('groups what a line wrote by kind, with the title of each kind', () => {
    const produced = [
      { item_id: 'i1', kind: 'analyzed_requirement', key: 'AR-001', version: 1 },
      { item_id: 'i2', kind: 'persona', key: 'PER-001', version: 1 },
    ]
    const entries = runEntries({
      messages: [],
      work: workEntries(
        [
          buildStep({
            sequence: 1,
            agent_role: 'analyst',
            stage: 'analysis',
            produced,
            started_at: '2026-10-06T08:31:00Z',
            finished_at: '2026-10-06T08:32:00Z',
          }),
        ],
        run,
      ),
      interrupts: [],
      stageTitles,
      subjectTitles,
      kindTitles: new Map([
        ['analyzed_requirement', 'Analysed requirement'],
        ['persona', 'Persona'],
      ]),
      view: 'user',
    })

    const groups = (entries[0] as Extract<ActivityEntry, { type: 'work' }>).kindGroups
    expect(groups.map(({ title, created }) => [title, created.length])).toEqual([
      ['Analysed requirement', 1],
      ['Persona', 1],
    ])
  })
})

describe('messagesByRun', () => {
  it('groups the messages by the run they belong to, in order', () => {
    const first = messages[0]
    const withoutRun: Message =
      first === undefined
        ? {
            id: 'm0',
            thread_id: 't0',
            sequence: 0,
            run_id: null,
            author: 'user',
            agent_role: null,
            content: '',
            artifact_refs: [],
            item_refs: [],
            delivery: null,
            delivered_in_step_id: null,
            created_at: '2026-10-06T08:00:00Z',
          }
        : { ...first, id: 'm0', run_id: null }
    const grouped = messagesByRun([withoutRun, ...messages])

    expect([...grouped.keys()]).toEqual([null, runIds.mentorMain3])
    expect(grouped.get(null)).toEqual([withoutRun])
  })
})

describe('entryAnchorId', () => {
  it('anchors an entry by its id', () => {
    expect(entryAnchorId('i1')).toBe('entry-i1')
  })
})
