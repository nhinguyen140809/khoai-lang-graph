import { describe, expect, it } from 'vitest'

import {
  artifactFixtureByKind,
  itemFixtureByKey,
} from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '@/mocks/shared/db'
import type { OutlineNode } from '@/modules/artifact/entities'
import type { DocumentEntry } from '@/modules/documents/entities'
import type { ContentDisplay } from '@/modules/workflow/entities'
import { routes } from '@/shared/routes'

import { documentTreeNodes, treeRootId } from '../document-tree.utils'

const analysis = artifactFixtureByKind(projectIds.mentor, 'requirements_analysis')
const persona = artifactFixtureByKind(projectIds.mentor, 'persona_catalog')
const raw = itemFixtureByKey(projectIds.mentor, 'RAW-001')

const entries: DocumentEntry[] = [
  {
    type: 'document',
    kind: 'persona_catalog',
    title: persona.title,
    artifact: persona,
    mark: 'approved',
  },
  {
    type: 'document',
    kind: 'requirements_analysis',
    title: analysis.title,
    artifact: analysis,
    mark: 'review',
  },
  {
    type: 'document',
    kind: 'product_backlog',
    title: 'Product backlog',
    artifact: null,
    mark: 'notStarted',
  },
  {
    type: 'group',
    kind: 'interview_transcript',
    title: 'Interview transcript',
    subjectItemKind: 'persona',
    documents: [],
    notStarted: [{ id: 'p1', title: 'Student' }],
    mark: 'notStarted',
  },
]

const { document: documentHref, item: itemHref } = routes.project(projectIds.mentor)
const hrefs = { document: documentHref, item: itemHref }

const outline: OutlineNode[] = [
  {
    type: 'group',
    id: 'group:root:raw_requirement',
    kind: 'raw_requirement',
    title: 'Stated need',
    count: 1,
    statusCounts: [{ status: 'draft', count: 1 }],
    children: [
      {
        type: 'item',
        id: `item:${raw.id}`,
        item: { ...raw, depth: 1 },
        title: 'I want to find a mentor',
        status: 'draft',
      },
    ],
  },
]

function nodesWith(openOutline: Parameters<typeof documentTreeNodes>[0]['openOutline']) {
  return documentTreeNodes({
    entries,
    openOutline,
    hrefs,
    view: 'user',
    displays: new Map<string, ContentDisplay>([
      ['persona_catalog', 'cards'],
      ['requirements_analysis', 'table'],
    ]),
  })
}

describe('documentTreeNodes', () => {
  it('lists the documents and the groups at the top, in the given order', () => {
    const nodes = nodesWith(null)

    expect(nodes[treeRootId]?.children).toEqual([
      `doc:${persona.id}`,
      `doc:${analysis.id}`,
      'kind:product_backlog',
      'kind:interview_transcript',
    ])
  })

  it('gives a document the icon of what its kind is made of, and the rows of a group none', () => {
    const nodes = nodesWith(null)

    expect(nodes[`doc:${persona.id}`]?.icon).toBe('documents.document.cards')
    expect(nodes[`doc:${analysis.id}`]?.icon).toBe('documents.document.table')
    expect(nodes['kind:interview_transcript']?.icon).toBeNull()
  })

  it('gives a document of a kind with no display the icon of a document alone', () => {
    const nodes = documentTreeNodes({
      entries,
      openOutline: null,
      hrefs,
      view: 'user',
      displays: new Map(),
    })

    expect(nodes[`doc:${persona.id}`]?.icon).toBe('documents.document.document')
  })

  it('gives a document its page and a document not started none', () => {
    const nodes = nodesWith(null)

    expect(nodes[`doc:${analysis.id}`]?.action).toEqual({
      type: 'open',
      href: documentHref(analysis.id),
    })
    expect(nodes['kind:product_backlog']?.action).toEqual({ type: 'none' })
  })

  it('gives a group and a subject no action', () => {
    const nodes = nodesWith(null)

    expect(nodes['kind:interview_transcript']?.action).toEqual({ type: 'none' })
    expect(nodes['subject:p1']?.action).toEqual({ type: 'none' })
  })

  it('lists the subjects without an artifact under the group', () => {
    const nodes = nodesWith(null)

    expect(nodes['kind:interview_transcript']?.children).toEqual(['subject:p1'])
  })

  it('puts the outline of the open document under its row', () => {
    const nodes = nodesWith({ artifactId: analysis.id, nodes: outline, isUnderReview: true })

    expect(nodes[`doc:${analysis.id}`]?.children).toEqual(['group:root:raw_requirement'])
    expect(nodes['group:root:raw_requirement']?.children).toEqual([`item:${raw.id}`])
    expect(nodes[`item:${raw.id}`]?.action).toEqual({ type: 'open', href: itemHref(raw.id) })
  })

  it('leaves the other documents without children', () => {
    const nodes = nodesWith({ artifactId: analysis.id, nodes: outline, isUnderReview: true })

    expect(nodes[`doc:${persona.id}`]?.children).toEqual([])
  })

  it('shows a message row in place of an outline that is loading or failed', () => {
    const nodes = nodesWith({
      artifactId: analysis.id,
      nodes: { message: 'The outline could not load.', isRetry: true },
      isUnderReview: false,
    })

    expect(nodes[`message:doc:${analysis.id}`]).toMatchObject({
      name: 'The outline could not load.',
      action: { type: 'retry' },
    })
  })
})

describe('the looks of the rows', () => {
  it('words a document by its mark, with the version when the mark has no letter', () => {
    const nodes = nodesWith(null)

    expect(nodes[`doc:${analysis.id}`]?.look).toMatchObject({ level: 'act', letter: 'R' })
    expect(nodes[`doc:${persona.id}`]?.look.text).toBe(
      `Approved, version ${String(persona.version)}`,
    )
  })

  it('shows an item by its status in a document under review', () => {
    const nodes = nodesWith({ artifactId: analysis.id, nodes: outline, isUnderReview: true })

    expect(nodes[`item:${raw.id}`]?.look).toMatchObject({
      level: 'act',
      text: 'Needs your review',
    })
  })

  it('shows a group of the outline by what it holds, and by its level only while collapsed', () => {
    const nodes = nodesWith({ artifactId: analysis.id, nodes: outline, isUnderReview: true })
    const group = nodes['group:root:raw_requirement']

    expect(group?.look).toMatchObject({ level: 'none', text: '1 to review' })
    expect(group?.collapsedLook).toMatchObject({ level: 'act', text: '1 to review' })
    expect(group?.count).toBe(1)
  })

  it('leaves the drafts of a document that is not under review without a level', () => {
    const nodes = nodesWith({ artifactId: analysis.id, nodes: outline, isUnderReview: false })

    expect(nodes['group:root:raw_requirement']?.collapsedLook).toMatchObject({
      level: 'none',
      text: null,
    })
  })

  it('counts the documents of a group', () => {
    expect(nodesWith(null)['kind:interview_transcript']?.count).toBe(0)
  })
})

describe('the location of the rows', () => {
  it('gives the titles from the document down to the parent of the row', () => {
    const nodes = nodesWith({ artifactId: analysis.id, nodes: outline, isUnderReview: true })

    expect(nodes[`item:${raw.id}`]?.location).toEqual([analysis.title, 'Stated need'])
  })

  it('gives nothing for a row at the top', () => {
    expect(nodesWith(null)[`doc:${analysis.id}`]?.location).toEqual([])
  })
})
