import { describe, expect, it } from 'vitest'

import type { Artifact } from '@/modules/artifact/entities'
import type { DocumentEntry } from '@/modules/documents/entities'

import {
  isSameView,
  readerAddress,
  readerViewOf,
  trailAfter,
  viewOfBlock,
  viewOfEntry,
} from '../reader.utils'
import { addressCases, sameViewCases, trailCases, viewCases } from './reader.utils.data'

describe('readerViewOf', () => {
  it.each(viewCases)('reads $name', ({ params, view }) => {
    expect(readerViewOf(params)).toEqual(view)
  })
})

describe('isSameView', () => {
  it.each(sameViewCases)('is $isSame for $name', ({ first, second, isSame }) => {
    expect(isSameView(first, second)).toBe(isSame)
  })
})

describe('readerAddress', () => {
  it.each(addressCases)('opens the reader on $name', ({ view, address }) => {
    expect(readerAddress('/projects/p1', view)).toBe(address)
  })
})

describe('trailAfter', () => {
  it.each(trailCases)('keeps $name', ({ trail, view, result }) => {
    expect(trailAfter(trail, view)).toEqual(result)
  })
})

describe('viewOfBlock', () => {
  it('opens the overview, a folder or an item of the document', () => {
    expect(viewOfBlock({ type: 'overview' }, 'a1')).toEqual({ kind: 'overview', artifactId: 'a1' })
    expect(viewOfBlock({ type: 'folder', nodeId: 'section:s1' }, 'a1')).toEqual({
      kind: 'folder',
      artifactId: 'a1',
      nodeId: 'section:s1',
    })
    expect(
      viewOfBlock(
        {
          type: 'item',
          item: { id: 'i1' } as Extract<
            Parameters<typeof viewOfBlock>[0],
            { type: 'item' }
          >['item'],
        },
        'a1',
      ),
    ).toEqual({ kind: 'item', itemId: 'i1' })
  })
})

describe('viewOfEntry', () => {
  const artifact = { id: 'a1' } as Artifact

  it('opens a document by its artifact, and a document that is not started by nothing', () => {
    const entry = { type: 'document', kind: 'k', title: 'K', mark: 'draft' } as const

    expect(viewOfEntry({ ...entry, artifact })).toEqual({ kind: 'document', artifactId: 'a1' })
    expect(viewOfEntry({ ...entry, artifact: null })).toBeNull()
  })

  it('opens a group by the folder of its kind, even when it holds one document', () => {
    const group: DocumentEntry = {
      type: 'group',
      kind: 'interview_transcript',
      title: 'Interview transcripts',
      subjectItemKind: null,
      documents: [{ artifact, mark: 'draft' }],
      notStarted: [],
      mark: 'draft',
    }

    expect(viewOfEntry(group)).toEqual({ kind: 'group', documentKind: 'interview_transcript' })
  })
})
