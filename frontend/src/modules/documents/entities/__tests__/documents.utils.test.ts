import { describe, expect, it } from 'vitest'

import type { DocumentMark } from '../types/documents.types'
import {
  documentEntries,
  documentMark,
  documentMarkLook,
  groupMark,
} from '../utils/documents.utils'
import {
  definedKinds,
  groupMarkCases,
  markCases,
  mentorArtifactOf,
  mentorArtifacts,
  titleFixtures,
} from './documents.utils.data'

describe('documentMark', () => {
  it.each(markCases)('gives $mark for $name', ({ artifact, writing, review, mark }) => {
    expect(
      documentMark(artifact, { writingIds: new Set(writing), reviewIds: new Set(review) }),
    ).toBe(mark)
  })
})

describe('groupMark', () => {
  it.each(groupMarkCases)('gives $mark for $name', ({ marks, mark }) => {
    expect(groupMark(marks.map((value: DocumentMark) => ({ mark: value })))).toBe(mark)
  })
})

describe('documentMarkLook', () => {
  it('gives the color of the level of the mark', () => {
    expect(documentMarkLook('review')).toMatchObject({
      level: 'act',
      color: 'warning',
      letter: 'R',
    })
    expect(documentMarkLook('writing')).toMatchObject({ level: 'follow', color: 'primary' })
    expect(documentMarkLook('notStarted')).toMatchObject({ level: 'quiet', color: 'muted' })
  })

  it('gives no color to a document with nothing to do', () => {
    expect(documentMarkLook('approved')).toMatchObject({ color: null, letter: null })
  })
})

describe('documentEntries', () => {
  const noIds = new Set<string>()
  // The mentor project before its backlog and its validation: the later stages have no artifact.
  const earlyArtifacts = mentorArtifacts.filter(
    ({ kind }) => kind !== 'product_backlog' && kind !== 'validation_report',
  )
  function entriesOf(options: {
    hasUnfinishedRun: boolean
    reviewIds?: string[]
    artifacts?: typeof mentorArtifacts
    subjects?: ReadonlyMap<string, { id: string; title: string }[]>
  }) {
    return documentEntries({
      kinds: definedKinds,
      titles: titleFixtures,
      artifacts: options.artifacts ?? earlyArtifacts,
      writingIds: noIds,
      reviewIds: new Set(options.reviewIds),
      subjects: options.subjects ?? new Map(),
      hasUnfinishedRun: options.hasUnfinishedRun,
    })
  }

  it('lists a row for each kind of the definition, in its order, while the run is unfinished', () => {
    expect(entriesOf({ hasUnfinishedRun: true }).map(({ kind }) => kind)).toEqual(
      definedKinds.map(({ kind }) => kind),
    )
  })

  it('gives a document for a kind of which a project has one, and a group for the others', () => {
    const entries = entriesOf({ hasUnfinishedRun: true, artifacts: mentorArtifacts })

    expect(entries.map(({ kind, type }) => `${kind}:${type}`)).toEqual([
      'elicitation_plan:document',
      'persona_catalog:document',
      'interview_transcript:group',
      'requirements_analysis:document',
      'requirement_specification:document',
      'product_backlog:document',
      'validation_report:group',
    ])
  })

  it('marks the kinds without an artifact as not started', () => {
    const entries = entriesOf({ hasUnfinishedRun: true })
    const backlog = entries.find(({ kind }) => kind === 'product_backlog')

    expect(backlog).toMatchObject({ type: 'document', artifact: null, mark: 'notStarted' })
  })

  it('leaves out the kinds without an artifact once the run is finished', () => {
    const kinds = entriesOf({ hasUnfinishedRun: false }).map(({ kind }) => kind)

    expect(kinds).not.toContain('validation_report')
    expect(kinds).not.toContain('product_backlog')
    expect(kinds).toContain('requirements_analysis')
  })

  it('marks the artifacts that the interrupt lists for review', () => {
    const analysis = mentorArtifactOf('requirements_analysis')
    const entries = entriesOf({ hasUnfinishedRun: true, reviewIds: [analysis.id] })

    expect(entries.find(({ kind }) => kind === 'requirements_analysis')).toMatchObject({
      mark: 'review',
    })
  })

  it('gives the artifacts of a group in the order of their titles, with the mark of the group', () => {
    const group = entriesOf({ hasUnfinishedRun: true }).find(
      ({ kind }) => kind === 'interview_transcript',
    )

    expect(group).toMatchObject({ type: 'group', subjectItemKind: 'persona' })
    if (group?.type !== 'group') return
    const titles = group.documents.map(({ artifact }) => artifact.title)
    expect(titles).toEqual(titles.toSorted((a, b) => a.localeCompare(b)))
  })

  it('gives a group the subjects that have no artifact yet, by the kind of its subjects', () => {
    const kind = definedKinds.find(({ subject_item_kind }) => subject_item_kind !== null)
    const subjectKind = kind?.subject_item_kind ?? ''
    const group = entriesOf({
      hasUnfinishedRun: true,
      subjects: new Map([[subjectKind, [{ id: 's1', title: 'Student' }]]]),
    }).find((entry) => entry.type === 'group' && entry.subjectItemKind === subjectKind)

    expect(group).toMatchObject({ notStarted: [{ id: 's1', title: 'Student' }] })
  })

  it('gives a group without subject items no subject', () => {
    const groups = entriesOf({ hasUnfinishedRun: true }).filter(({ type }) => type === 'group')

    expect(groups.every((group) => group.type === 'group' && group.notStarted.length === 0)).toBe(
      true,
    )
  })
})
