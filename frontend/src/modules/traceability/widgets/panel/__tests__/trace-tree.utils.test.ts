import type { Route } from 'next'
import { describe, expect, it } from 'vitest'

import { traceTreeRootId } from '../trace-tree.types'
import { outlineNodesOf, traceRows } from '../trace-tree.utils'
import { attention, documents, entries, items, kindViews } from './trace-tree.utils.data'

const itemTrace = (itemId: string): Route => `/trace/items/${itemId}` as Route

/** The outline of every document of the project, drawn from the items the panel read. */
const outlinesOf = (read = items) =>
  outlineNodesOf({ documents, items: read, kinds: kindViews, issueKinds: [] })

describe('outlineNodesOf', () => {
  it('draws the outline of every document of the project, without the superseded items', () => {
    const outlines = outlinesOf()
    expect(outlines.get('a-spec')).toMatchObject([
      {
        type: 'group',
        title: 'Requirement',
        count: 2,
        children: [
          { type: 'item', title: 'Search mentors' },
          { type: 'item', title: 'Filter by field' },
        ],
      },
    ])
    expect(outlines.get('a-tra')).toMatchObject([
      { type: 'group', title: 'Message', count: 1, children: [{ title: 'Hello' }] },
    ])
  })
})

describe('traceRows', () => {
  const rows = traceRows({
    entries,
    outlines: outlinesOf(),
    attention,
    itemTrace,
  })

  it('draws every document with the items of each one, whatever the page on screen', () => {
    const root = rows.rows[traceTreeRootId]
    if (root === undefined) throw new Error('The tree lost its root')
    expect(root.children).toEqual(['document:a-spec', 'group:interview_transcript'])

    const spec = rows.rows['document:a-spec']
    expect(spec?.name).toBe('Requirement specification')
    // The items of a document sit under the run of their kind.
    expect(spec?.children).toEqual(['document:a-spec:group:root:requirement'])
    expect(rows.rows['document:a-spec:group:root:requirement']?.children).toEqual([
      'document:a-spec:group:root:requirement:item:i-1',
      'document:a-spec:group:root:requirement:item:i-2',
    ])

    // The documents of a group sit under the row of the group, with the subjects not started; the
    // transcript draws its items too, not only the document open on screen.
    const group = rows.rows['group:interview_transcript']
    expect(group?.children).toEqual(['document:a-tra', 'not-started:s-1'])
    expect(rows.rows['document:a-tra']?.children).toEqual(['document:a-tra:group:root:message'])
    expect(rows.rows['document:a-tra:group:root:message']?.children).toEqual([
      'document:a-tra:group:root:message:item:i-3',
    ])
  })

  it('colors a document row by the level of the item under it that asks most', () => {
    expect(rows.rows['document:a-spec']?.tone).toBe('warning')
    expect(rows.rows['document:a-tra']?.tone).toBe('primary')
    // A document whose items need nothing keeps the plain color.
    expect(rows.rows['not-started:s-1']?.tone).toBeNull()
  })

  it('colors an item row by its own attention, with its reasons for the tooltip', () => {
    const row = rows.rows['document:a-spec:group:root:requirement:item:i-1']
    // The attention map of the test answers none for every item: the plain color, no reasons.
    expect(row?.tone).toBeNull()
    expect(row?.reasons).toEqual([])
    expect(row?.href).toBe('/trace/items/i-1')
  })

  it('finds the row of the item on screen, in whatever document it sits', () => {
    expect(rows.rowOfItem.get('i-1')).toBe('document:a-spec:group:root:requirement:item:i-1')
    expect(rows.rowOfItem.get('i-3')).toBe('document:a-tra:group:root:message:item:i-3')
    // A superseded item draws no row.
    expect(rows.rowOfItem.get('i-0')).toBeUndefined()
  })
})
