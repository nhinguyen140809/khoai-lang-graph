import type { TraceLink } from '@/features/artifacts'

import { mockItems } from './items.fixtures'
import { linkId, PROJECT_IDS } from './mock-ids.constants'

// The trace links of the mock project: the chain of the backlog item US-004
// down to its raw source with the interview message behind it, the concern of
// the analysis, and one dependency between requirements. Both ends resolve to
// the mock items, as the API resolves them.

function byKey(key: string) {
  const item = mockItems.find((entry) => entry.key === key)
  if (item === undefined) throw new Error(`mock link end ${key} is not a mock item`)
  return item
}

function link(
  n: number,
  link_type: string,
  sourceKey: string,
  targetKey: string,
  quote: string | null = null,
): TraceLink {
  const source = byKey(sourceKey)
  const target = byKey(targetKey)
  return {
    id: linkId(n),
    project_id: PROJECT_IDS.mentor,
    link_type,
    source: {
      id: source.id,
      key: source.key,
      kind: source.kind,
      review_status: source.review_status,
    },
    target: {
      id: target.id,
      key: target.key,
      kind: target.kind,
      review_status: target.review_status,
    },
    target_version: 1,
    quote,
    note: null,
  }
}

/** Every trace link of the mock data. */
export const mockLinks: TraceLink[] = [
  link(1, 'derived_from', 'US-004', 'REQ-001'),
  link(2, 'derived_from', 'REQ-001', 'AR-003'),
  link(3, 'derived_from', 'AR-003', 'RAW-002'),
  link(4, 'evidenced_by', 'RAW-002', 'PER-001#1', 'I never know who is free this week'),
  link(5, 'concerns', 'AR-003', 'AMB-001'),
  link(6, 'depends_on', 'REQ-002', 'REQ-003'),
]
