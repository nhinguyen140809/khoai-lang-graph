import type { MatrixChainRef, MatrixRow, TraceCoverage } from '@/features/traceability'

import { mockItems } from './items.fixtures'
import { mockLinks } from './links.fixtures'

function ref(key: string): MatrixChainRef {
  const item = mockItems.find(
    (entry: { key: string; id: string; kind: string; review_status: string }) => entry.key === key,
  )
  if (item === undefined) throw new Error(`mock chain end ${key} is not a mock item`)
  const found: MatrixChainRef = {
    id: item.id,
    key: item.key,
    kind: item.kind,
    review_status: item.review_status,
  }
  return found
}

function derivedTarget(key: string): string | null {
  const link = mockLinks.find(
    (entry) => entry.link_type === 'derived_from' && entry.source.key === key,
  )
  return link ? link.target.key : null
}

function evidenceOf(key: string): string[] {
  return mockLinks
    .filter((link) => link.link_type === 'evidenced_by' && link.source.key === key)
    .map((link) => link.target.key)
}

/** The matrix rows of the mock project: US-004 down to its raw source. */
export function mockMatrixRows(): MatrixRow[] {
  const spec = derivedTarget('US-004')
  const analyzed = spec ? derivedTarget(spec) : null
  const source = analyzed ? derivedTarget(analyzed) : null
  return [
    {
      backlog: ref('US-004'),
      spec: spec ? ref(spec) : null,
      analyzed: analyzed ? ref(analyzed) : null,
      source: source ? [ref(source)] : [],
      evidence: source ? evidenceOf(source).map(ref) : [],
    },
    {
      backlog: null,
      spec: ref('REQ-002'),
      analyzed: null,
      source: [],
      evidence: [],
    },
    {
      backlog: null,
      spec: ref('REQ-003'),
      analyzed: null,
      source: [],
      evidence: [],
    },
  ]
}

/** The coverage lists of the mock project. */
export function mockCoverage(): TraceCoverage {
  return {
    no_backlog_item: { count: 2, items: [ref('REQ-002'), ref('REQ-003')] },
    no_source: { count: 2, items: [ref('REQ-002'), ref('REQ-003')] },
    needs_review: { count: 1, items: [ref('AMB-001')] },
  }
}

export type { MatrixChainRef, MatrixRow, TraceCoverage }
