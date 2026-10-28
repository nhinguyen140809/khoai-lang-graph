import type { IssueKind } from '@/modules/workflow/entities/@x/artifact'

import type { IssueLink } from '../../types/issues.types'

/** An item with the fields that a list of issues reads. */
function item(id: string, key: string, kind: string, status?: string) {
  return { id, key, kind, content: status === undefined ? {} : { status } }
}

function link(sourceId: string, targetId: string): IssueLink {
  return { source_item_id: sourceId, target_item_id: targetId }
}

const requirement = item('r1', 'AR-001', 'analyzed_requirement')
const secondRequirement = item('r2', 'AR-002', 'analyzed_requirement')

/** The issue kinds of workflow version 1. */
const versionOneKinds: IssueKind[] = ['ambiguity_issue', 'conflict', 'validation_issue'].map(
  (kind) => ({ kind, statusField: 'status', openValues: ['open'] }),
)

/** Cases for the issue kinds of version 1: the items and links, and the keys grouped by kind, issue and target. */
const versionOneCases = [
  {
    name: 'lists an open issue under its kind with the item it concerns',
    items: [requirement, item('a1', 'AMB-001', 'ambiguity_issue', 'open')],
    links: [link('a1', 'r1')],
    expected: [
      { kind: 'ambiguity_issue', issues: [{ key: 'AMB-001', subjects: ['AR-001'] }] },
      { kind: 'conflict', issues: [] },
      { kind: 'validation_issue', issues: [] },
    ],
  },
  {
    name: 'leaves out an issue that is not open',
    items: [requirement, item('a1', 'AMB-001', 'ambiguity_issue', 'resolved')],
    links: [link('a1', 'r1')],
    expected: [
      { kind: 'ambiguity_issue', issues: [] },
      { kind: 'conflict', issues: [] },
      { kind: 'validation_issue', issues: [] },
    ],
  },
  {
    name: 'orders the issues of a kind by key',
    items: [item('c2', 'CONF-002', 'conflict', 'open'), item('c1', 'CONF-001', 'conflict', 'open')],
    links: [],
    expected: [
      { kind: 'ambiguity_issue', issues: [] },
      {
        kind: 'conflict',
        issues: [
          { key: 'CONF-001', subjects: [] },
          { key: 'CONF-002', subjects: [] },
        ],
      },
      { kind: 'validation_issue', issues: [] },
    ],
  },
  {
    name: 'lists every item that an issue is about, and leaves out one that is not in the list',
    items: [requirement, secondRequirement, item('v1', 'VAL-001', 'validation_issue', 'open')],
    links: [link('v1', 'r1'), link('v1', 'r2'), link('v1', 'gone')],
    expected: [
      { kind: 'ambiguity_issue', issues: [] },
      { kind: 'conflict', issues: [] },
      { kind: 'validation_issue', issues: [{ key: 'VAL-001', subjects: ['AR-001', 'AR-002'] }] },
    ],
  },
  {
    name: 'does not take the links that point at an issue for the items it is about',
    items: [requirement, item('a1', 'AMB-001', 'ambiguity_issue', 'open')],
    links: [link('r1', 'a1')],
    expected: [
      { kind: 'ambiguity_issue', issues: [{ key: 'AMB-001', subjects: [] }] },
      { kind: 'conflict', issues: [] },
      { kind: 'validation_issue', issues: [] },
    ],
  },
]

/** The items, links and issue kinds given to `issuesWithSubjects`, and the keys it groups by kind, then issue, then target. */
export const issueCases = [
  ...versionOneCases.map((issueCase) => ({ ...issueCase, kinds: versionOneKinds })),
  {
    name: 'reads the status from the field and the value that the issue kind names',
    kinds: [{ kind: 'doubt', statusField: 'state', openValues: ['raised'] }],
    items: [
      { id: 'd1', key: 'Q-001', kind: 'doubt', content: { state: 'raised' } },
      { id: 'd2', key: 'Q-002', kind: 'doubt', content: { state: 'closed' } },
      { id: 'd3', key: 'Q-003', kind: 'doubt', content: { status: 'open' } },
    ],
    links: [],
    expected: [{ kind: 'doubt', issues: [{ key: 'Q-001', subjects: [] }] }],
  },
  {
    name: 'lists no group when the definition has no issue kind',
    kinds: [],
    items: [item('a1', 'AMB-001', 'ambiguity_issue', 'open')],
    links: [],
    expected: [],
  },
]
