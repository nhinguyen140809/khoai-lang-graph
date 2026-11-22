import { describe, expect, it } from 'vitest'

import type { OutlineNode } from '@/modules/artifact/entities'

import { groupTrail, readerTrail, trailPlaceOf } from '../reader-trail.utils'

const item = {
  id: 'i1',
  title: 'Request',
} as unknown as Extract<OutlineNode, { type: 'item' }>

const folder = {
  type: 'group',
  id: 'group:root:request',
  kind: 'request',
  title: 'Requests',
  count: 1,
  statusCounts: [],
  children: [{ ...item, type: 'item', id: 'item:i1' }],
} as OutlineNode

const base = {
  documentsTitle: 'Documents',
  artifact: { id: 'a1', title: 'Analysis' },
  nodes: [folder],
}

describe('readerTrail', () => {
  it('ends a document at its title, which opens nothing', () => {
    expect(readerTrail({ ...base, place: { type: 'document' } })).toEqual([
      { title: 'Documents', view: { kind: 'documents' } },
      { title: 'Analysis', view: null },
    ])
  })

  it('ends the overview under the document, which opens', () => {
    expect(readerTrail({ ...base, place: { type: 'overview', title: 'Overview' } })).toEqual([
      { title: 'Documents', view: { kind: 'documents' } },
      { title: 'Analysis', view: { kind: 'document', artifactId: 'a1' } },
      { title: 'Overview', view: null },
    ])
  })

  it('ends a folder at its own title', () => {
    expect(readerTrail({ ...base, place: { type: 'folder', nodeId: folder.id } })).toEqual([
      { title: 'Documents', view: { kind: 'documents' } },
      { title: 'Analysis', view: { kind: 'document', artifactId: 'a1' } },
      { title: 'Requests', view: null },
    ])
  })

  it('puts the folders above an item, each opening its folder, and the item last', () => {
    expect(
      readerTrail({ ...base, place: { type: 'item', nodeId: 'item:i1', title: 'Request' } }),
    ).toEqual([
      { title: 'Documents', view: { kind: 'documents' } },
      { title: 'Analysis', view: { kind: 'document', artifactId: 'a1' } },
      { title: 'Requests', view: { kind: 'folder', artifactId: 'a1', nodeId: folder.id } },
      { title: 'Request', view: null },
    ])
  })

  it('puts the folder of the kind between the list and a document that is one of several', () => {
    const group = { kind: 'interview_transcript', title: 'Interview transcript' }
    const folderOfKind = {
      title: 'Interview transcript',
      view: { kind: 'group', documentKind: 'interview_transcript' },
    }

    expect(readerTrail({ ...base, group, place: { type: 'document' } })).toEqual([
      { title: 'Documents', view: { kind: 'documents' } },
      folderOfKind,
      { title: 'Analysis', view: null },
    ])
    expect(
      readerTrail({ ...base, group, place: { type: 'item', nodeId: 'item:i1', title: 'Request' } }),
    ).toEqual([
      { title: 'Documents', view: { kind: 'documents' } },
      folderOfKind,
      { title: 'Analysis', view: { kind: 'document', artifactId: 'a1' } },
      { title: 'Requests', view: { kind: 'folder', artifactId: 'a1', nodeId: folder.id } },
      { title: 'Request', view: null },
    ])
  })
})

describe('groupTrail', () => {
  it('ends the folder of a kind at its own title, which opens nothing', () => {
    expect(groupTrail({ documentsTitle: 'Documents', title: 'Interview transcript' })).toEqual([
      { title: 'Documents', view: { kind: 'documents' } },
      { title: 'Interview transcript', view: null },
    ])
  })
})

describe('trailPlaceOf', () => {
  it('names the place of each view of a document', () => {
    expect(trailPlaceOf({ kind: 'document', artifactId: 'a1' }, [folder])).toEqual({
      type: 'document',
    })
    expect(trailPlaceOf({ kind: 'folder', artifactId: 'a1', nodeId: folder.id }, [folder])).toEqual(
      {
        type: 'folder',
        nodeId: folder.id,
      },
    )
    expect(trailPlaceOf({ kind: 'item', itemId: 'i1' }, [folder])).toEqual({
      type: 'item',
      nodeId: 'item:i1',
      title: 'Request',
    })
  })
})
