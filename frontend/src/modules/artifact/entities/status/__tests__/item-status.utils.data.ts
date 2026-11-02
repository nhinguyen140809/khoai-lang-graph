import type { ArtifactItem, OutlineItem } from '../../items/items.types'
import type { AttentionLevel, ItemStatus } from '../item-status.types'

const agent = {
  actor: 'agent',
  agent_role: null,
  user_id: null,
  run_id: null,
  step_id: null,
} as const
const user = { ...agent, actor: 'user' } as const

type StatusItem = Pick<ArtifactItem, 'kind' | 'content' | 'review_status' | 'updated_by'>

function statusItem(overrides: Partial<StatusItem>): StatusItem {
  return {
    kind: 'raw_requirement',
    review_status: 'draft',
    updated_by: agent,
    content: {},
    ...overrides,
  }
}

export const itemStatusCases: {
  name: string
  item: StatusItem
  status: ItemStatus
}[] = [
  { name: 'a draft', item: statusItem({}), status: 'draft' },
  { name: 'an approved item', item: statusItem({ review_status: 'approved' }), status: 'approved' },
  { name: 'a rejected item', item: statusItem({ review_status: 'rejected' }), status: 'rejected' },
  {
    name: 'a superseded item as a draft',
    item: statusItem({ review_status: 'superseded' }),
    status: 'draft',
  },
  { name: 'a draft changed by the user', item: statusItem({ updated_by: user }), status: 'edited' },
  {
    name: 'an approved item changed by the user',
    item: statusItem({ review_status: 'approved', updated_by: user }),
    status: 'approved',
  },
  {
    name: 'an open issue',
    item: statusItem({ kind: 'conflict', content: { status: 'open' } }),
    status: 'openIssue',
  },
  {
    name: 'an open issue edited by the user, the issue first',
    item: statusItem({ kind: 'conflict', content: { status: 'open' }, updated_by: user }),
    status: 'openIssue',
  },
  {
    name: 'a closed issue as its review status',
    item: statusItem({
      kind: 'conflict',
      content: { status: 'resolved' },
      review_status: 'approved',
    }),
    status: 'approved',
  },
]

export const attentionCases: {
  status: ItemStatus
  isUnderReview: boolean
  level: AttentionLevel
}[] = [
  { status: 'draft', isUnderReview: true, level: 'act' },
  { status: 'draft', isUnderReview: false, level: 'none' },
  { status: 'openIssue', isUnderReview: true, level: 'act' },
  { status: 'openIssue', isUnderReview: false, level: 'none' },
  { status: 'edited', isUnderReview: true, level: 'follow' },
  { status: 'edited', isUnderReview: false, level: 'follow' },
  { status: 'approved', isUnderReview: true, level: 'none' },
  { status: 'approved', isUnderReview: false, level: 'none' },
  { status: 'rejected', isUnderReview: true, level: 'quiet' },
  { status: 'rejected', isUnderReview: false, level: 'quiet' },
]

export const highestLevelCases: { levels: AttentionLevel[]; level: AttentionLevel }[] = [
  { levels: [], level: 'none' },
  { levels: ['quiet'], level: 'quiet' },
  { levels: ['none', 'quiet'], level: 'none' },
  { levels: ['none', 'follow', 'quiet'], level: 'follow' },
  { levels: ['follow', 'act', 'none'], level: 'act' },
]

function counted(key: string): OutlineItem {
  return { key } as OutlineItem
}

export const attentionCountCases: {
  name: string
  statuses: { item: OutlineItem; status: ItemStatus }[]
  isUnderReview: boolean
  counts: { status: ItemStatus; level: AttentionLevel; count: number; first: string }[]
}[] = [
  {
    name: 'the levels in order, with the first item of each',
    statuses: [
      { item: counted('A'), status: 'edited' },
      { item: counted('B'), status: 'draft' },
      { item: counted('C'), status: 'draft' },
      { item: counted('D'), status: 'openIssue' },
      { item: counted('E'), status: 'approved' },
      { item: counted('F'), status: 'rejected' },
    ],
    isUnderReview: true,
    counts: [
      { status: 'draft', level: 'act', count: 2, first: 'B' },
      { status: 'openIssue', level: 'act', count: 1, first: 'D' },
      { status: 'edited', level: 'follow', count: 1, first: 'A' },
    ],
  },
  {
    name: 'only what changes outside a review',
    statuses: [
      { item: counted('A'), status: 'draft' },
      { item: counted('B'), status: 'edited' },
    ],
    isUnderReview: false,
    counts: [{ status: 'edited', level: 'follow', count: 1, first: 'B' }],
  },
  { name: 'nothing', statuses: [], isUnderReview: true, counts: [] },
]
