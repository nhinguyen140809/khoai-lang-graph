import { describe, expect, it } from 'vitest'

import { buildMessage } from '@/mocks/messages/messages.fixtures'
import { buildStep } from '@/mocks/runs/fixtures/runs.fixtures'
import { runIds } from '@/mocks/shared/db'
import type { Interrupt } from '@/modules/review/entities'
import type { StepNote } from '@/modules/run/entities'
import { workEntries } from '@/modules/run/entities'
import type { Message } from '@/modules/thread/entities'

import {
  entryAnchorId,
  hasRunEnded,
  messagesByRun,
  runEntries,
  shownWork,
} from '../activity-entries.utils'
import {
  kinds,
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
    kinds,
    view,
  })
}

describe('runEntries', () => {
  it('orders the entries by their time', () => {
    const entries = entriesOf('user')

    expect(entries.map(({ type, id }) => `${type}:${id}`)).toEqual(['message:m1', 'phase:s1'])
  })

  it('leaves a phase of a stage the user does not see out of the user view, and keeps it in the developer view', () => {
    expect(entriesOf('user').map(({ type }) => type)).toEqual(['message', 'phase'])
    expect(entriesOf('developer').map(({ type }) => type)).toEqual(['message', 'phase', 'phase'])
  })

  it('gives each phase the titles of its stage and its subject', () => {
    const first = entriesOf('user').find(({ type }) => type === 'phase')

    expect(first?.type === 'phase' && first.stageTitle).toBe('Planning the interviews')
    expect(first?.type === 'phase' && first.subjectTitle).toBeNull()
  })

  it('puts what a phase wrote under it, by kind, with the title of each kind', () => {
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
      kinds: new Map([
        ['analyzed_requirement', { title: 'Analysed requirement', isNavigable: true }],
        ['persona', { title: 'Persona', isNavigable: false }],
      ]),
      view: 'user',
    })

    expect(entries.map(({ type }) => type)).toEqual(['phase', 'written'])
    const written = entries[1]
    const groups = written?.type === 'written' ? written.kindGroups : []
    expect(groups.map(({ title, created }) => [title, created.length])).toEqual([
      ['Analysed requirement', 1],
      ['Persona', 1],
    ])
    // A kind without pages is only counted by the chat; a kind that is not known takes them.
    expect(groups.map(({ isNavigable }) => isNavigable)).toEqual([true, false])
    expect(written?.type === 'written' && written.phaseId).toBe('s1')
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

describe('hasRunEnded', () => {
  const at = (clock: string) => `2026-10-06T10:${clock}Z`
  const failed = buildStep({
    sequence: 1,
    agent_role: 'corpus_builder',
    stage: 'research',
    status: 'failed',
    error: 'It broke.',
    started_at: at('01:00'),
    finished_at: at('01:50'),
  })

  function entriesFor(status: 'failed' | 'succeeded') {
    return runEntries({
      messages: [],
      work: workEntries([{ ...failed, status }], run),
      interrupts: [],
      stageTitles: new Map([['research', 'Finding evidence']]),
      subjectTitles,
      kinds,
      view: 'user',
    })
  }

  it('says that a run has ended when its last entry is the failure of a phase', () => {
    expect(hasRunEnded(entriesFor('failed'))).toBe(true)
  })

  it('says that a run goes on when its last entry is not an end', () => {
    expect(hasRunEnded(entriesFor('succeeded'))).toBe(false)
  })

  it('says that a run with no entry has not ended', () => {
    expect(hasRunEnded([])).toBe(false)
  })
})

describe('shownWork', () => {
  const work = [{ stage: 'intent_routing' }, { stage: 'planning' }]
  const titles = new Map([['planning', 'Planning the interviews']])

  it('leaves out the lines of an internal stage for the user', () => {
    expect(shownWork(work, titles, 'user')).toEqual([{ stage: 'planning' }])
  })

  it('keeps every line for the developer', () => {
    expect(shownWork(work, titles, 'developer')).toEqual(work)
  })

  it('leaves nothing out while the stage titles have not loaded', () => {
    expect(shownWork(work, new Map(), 'user')).toEqual(work)
  })
})

describe('runEntries with phases', () => {
  const at = (clock: string) => `2026-10-06T10:${clock}Z`
  const stages = new Map([
    ['research', 'Finding evidence'],
    ['planning', 'Planning'],
  ])
  const search = (text: string, clock: string) => ({
    kind: 'tool' as const,
    tool: 'search',
    text,
    created_at: at(clock),
  })

  function entriesOfSteps(input: {
    steps: Parameters<typeof workEntries>[0]
    messages?: Message[]
    interrupts?: Parameters<typeof runEntries>[0]['interrupts']
  }) {
    return runEntries({
      messages: input.messages ?? [],
      work: workEntries(input.steps, run),
      interrupts: input.interrupts ?? [],
      stageTitles: stages,
      subjectTitles,
      kinds,
      view: 'user',
    })
  }

  const researchStep = (sequence: number, role: string, notes: StepNote[]) =>
    buildStep({
      sequence,
      agent_role: role,
      stage: 'research',
      node: role,
      started_at: at(`0${String(sequence)}:00`),
      finished_at: at(`0${String(sequence)}:50`),
      notes,
    })

  it('puts one separator for the steps of a stage, with the notes and the uses of a tool under it in the order written', () => {
    const entries = entriesOfSteps({
      steps: [
        researchStep(1, 'corpus_builder', [
          { kind: 'doing', text: 'Starting.', created_at: at('01:10') },
          search('One.', '01:20'),
          search('Two.', '01:30'),
          { kind: 'finding', text: 'Found.', created_at: at('01:40') },
        ]),
        researchStep(2, 'stakeholder_miner', [
          { kind: 'doing', text: 'Reading.', created_at: at('02:10') },
        ]),
      ],
    })

    expect(entries.map(({ type }) => type)).toEqual(['phase', 'note', 'tool', 'note', 'note'])
    const tool = entries[2]
    expect(tool?.type === 'tool' && tool.use.notes.map(({ text }) => text)).toEqual([
      'One.',
      'Two.',
    ])
    expect(entries.slice(1).every((entry) => 'phaseId' in entry && entry.phaseId === 's1')).toBe(
      true,
    )
  })

  it('starts a new phase for a stage that comes after another', () => {
    const entries = entriesOfSteps({
      steps: [
        researchStep(1, 'corpus_builder', []),
        buildStep({
          sequence: 2,
          agent_role: 'planner',
          stage: 'planning',
          started_at: at('02:00'),
          finished_at: at('02:50'),
        }),
      ],
    })

    expect(entries.filter(({ type }) => type === 'phase')).toHaveLength(2)
  })

  it('does not cut a phase at a message, which comes between its items where it was written', () => {
    const entries = entriesOfSteps({
      steps: [
        researchStep(1, 'corpus_builder', [
          { kind: 'doing', text: 'First.', created_at: at('01:10') },
          { kind: 'finding', text: 'Second.', created_at: at('01:30') },
        ]),
      ],
      messages: [
        buildMessage({
          id: 'm-a',
          thread_id: run.thread_id,
          sequence: 2,
          created_at: at('01:20'),
          run_id: run.id,
        }),
      ],
    })

    expect(entries.map(({ type }) => type)).toEqual(['phase', 'note', 'message', 'note'])
  })

  it('puts the answer to a question where it was given, before the work that goes on from it', () => {
    const asked: Interrupt = {
      id: 'ask-1',
      run_id: run.id,
      step_id: 's1',
      node: 'ask_plan',
      purpose: 'ask',
      prompt: 'Three questions.',
      options: [],
      questions: [],
      allow_edits: false,
      review_artifacts: [],
      status: 'resolved',
      created_at: at('01:20'),
      resolved_at: at('01:40'),
      decision: {
        option: null,
        feedback: null,
        answers: {},
        decided_by: 'u1',
        decided_at: at('01:40'),
      },
    }
    const entries = entriesOfSteps({
      steps: [
        researchStep(1, 'corpus_builder', [
          { kind: 'doing', text: 'Asking.', created_at: at('01:10') },
          { kind: 'finding', text: 'Goes on.', created_at: at('01:50') },
        ]),
      ],
      interrupts: [asked],
    })

    // The work is cut where the question came; what it does after the answer is a phase that
    // continues, which comes after the answer and not before it.
    expect(entries.map(({ type }) => type)).toEqual(['phase', 'note', 'review', 'phase', 'note'])
  })

  it('puts the failure of a phase last, as an item under it', () => {
    const entries = entriesOfSteps({
      steps: [
        buildStep({
          sequence: 1,
          agent_role: 'corpus_builder',
          stage: 'research',
          status: 'failed',
          error: 'It broke.',
          started_at: at('01:00'),
          finished_at: at('01:50'),
          notes: [{ kind: 'doing', text: 'Starting.', created_at: at('01:10') }],
        }),
      ],
    })

    expect(entries.map(({ type }) => type)).toEqual(['phase', 'note', 'failure'])
  })

  it('keeps the use of a tool in order when it has the time of the note after it', () => {
    const entries = entriesOfSteps({
      steps: [
        researchStep(1, 'corpus_builder', [
          search('One.', '01:20'),
          { kind: 'finding', text: 'Found.', created_at: at('01:20') },
        ]),
      ],
    })

    expect(entries.map(({ type }) => type)).toEqual(['phase', 'tool', 'note'])
  })
})
