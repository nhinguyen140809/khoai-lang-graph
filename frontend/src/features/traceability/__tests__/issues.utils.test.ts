import { describe, expect, it } from 'vitest'

import { openIssues } from '../issues.utils'
import type { Link, ProjectItem } from '../traceability.types'

const item = (id: string, kind: string, status?: string): ProjectItem => ({
  id,
  key: id.toUpperCase(),
  kind,
  content: status === undefined ? {} : { status },
})
const link = (source: string, target: string): Link => ({
  id: `${source}-${target}`,
  source_item_id: source,
  target_item_id: target,
  link_type: 'concerns',
})

describe('openIssues', () => {
  const items = [
    item('amb2', 'ambiguity_issue', 'open'),
    item('amb1', 'ambiguity_issue', 'open'),
    item('amb3', 'ambiguity_issue', 'resolved'),
    item('conf', 'conflict', 'open'),
    item('req', 'spec_requirement'),
  ]

  it('groups the open issues by kind, in the order of the keys, and leaves out the resolved ones', () => {
    const groups = openIssues(items, [])

    expect(groups.map(({ kind, entries }) => [kind, entries.map(({ issue }) => issue.id)])).toEqual(
      [
        ['ambiguity_issue', ['amb1', 'amb2']],
        ['conflict', ['conf']],
        ['validation_issue', []],
      ],
    )
  })

  it('gives each issue the items that it is about', () => {
    const [first] = openIssues(items, [
      link('amb1', 'req'),
      link('amb1', 'gone'),
      link('conf', 'req'),
    ])

    expect(first?.entries[0]?.about.map(({ id }) => id)).toEqual(['req'])
  })
})
