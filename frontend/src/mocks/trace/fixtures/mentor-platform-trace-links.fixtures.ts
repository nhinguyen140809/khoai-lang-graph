import type { LinkSpec } from '../trace-links.types'

// The links of the trace, from the later item to the earlier one.
const evidence: LinkSpec[] = [
  {
    source: 'RAW-001',
    target: 'PER-001#2',
    type: 'evidenced_by',
    targetQuote: 'I ask seniors in my club',
  },
  {
    source: 'RAW-002',
    target: 'PER-001#2',
    type: 'evidenced_by',
    targetQuote: 'I never know who is free this week',
  },
  {
    source: 'RAW-003',
    target: 'PER-001#6',
    type: 'evidenced_by',
    targetQuote: 'I want to cancel without writing to anyone',
  },
  {
    source: 'RAW-004',
    target: 'PER-001#6',
    type: 'evidenced_by',
    targetQuote: 'a reminder the hour before',
  },
  {
    source: 'RAW-005',
    target: 'PER-002#2',
    type: 'evidenced_by',
    targetQuote: 'I can give two afternoons a week',
  },
  {
    source: 'RAW-006',
    target: 'PER-002#6',
    type: 'evidenced_by',
    targetQuote: 'I also want to see several students at once',
  },
  {
    source: 'RAW-007',
    target: 'PER-003#2',
    type: 'evidenced_by',
    targetQuote: 'A mentor must be approved before a student can see the profile',
  },
  {
    source: 'RAW-008',
    target: 'PER-003#4',
    type: 'evidenced_by',
    targetQuote: 'I would like to approve a booking too',
  },
  { source: 'RAW-001', target: 'PER-001', type: 'stated_by' },
  { source: 'RAW-002', target: 'PER-001', type: 'stated_by' },
  { source: 'RAW-005', target: 'PER-002', type: 'stated_by' },
  { source: 'RAW-007', target: 'PER-003', type: 'stated_by' },
  { source: 'AR-007', target: 'PER-001', type: 'involves' },
  { source: 'AR-007', target: 'PER-003', type: 'involves' },
  { source: 'CONF-001', target: 'PER-001', type: 'involves' },
  { source: 'CONF-001', target: 'PER-003', type: 'involves' },
]

const derivations: LinkSpec[] = [
  { source: 'AR-001', target: 'RAW-001', type: 'derived_from' },
  { source: 'AR-002', target: 'RAW-005', type: 'derived_from' },
  {
    source: 'AR-003',
    target: 'RAW-002',
    type: 'derived_from',
    sourceQuote: 'sees their free hours',
    targetQuote: 'I never know who is free this week',
  },
  { source: 'AR-003', target: 'LN-001', type: 'derived_from' },
  { source: 'AR-004', target: 'RAW-003', type: 'derived_from' },
  // RAW-004 was edited twice after this link was made.
  { source: 'AR-005', target: 'RAW-004', type: 'derived_from', targetVersion: 1 },
  { source: 'AR-006', target: 'RAW-007', type: 'derived_from' },
  { source: 'AR-007', target: 'RAW-008', type: 'derived_from', targetVersion: 1 },
  { source: 'AR-008', target: 'RAW-006', type: 'derived_from' },
  { source: 'AR-009', target: 'RAW-004', type: 'derived_from' },
  { source: 'AR-010', target: 'RAW-002', type: 'derived_from' },
  {
    source: 'REQ-001',
    target: 'AR-001',
    type: 'derived_from',
    sourceQuote: 'search mentors by field of study',
    targetQuote: 'lists mentors by field of study',
  },
  {
    source: 'REQ-002',
    target: 'AR-003',
    type: 'derived_from',
    // Made from the first version of the analysis, which the user has edited since.
    targetVersion: 1,
    // Words of both ends: of the requirement and of the analysis it is based on.
    sourceQuote: 'filter mentors by field of study',
    targetQuote: 'searches mentors by field',
  },
  { source: 'REQ-003', target: 'AR-007', type: 'derived_from', targetVersion: 1 },
  { source: 'REQ-004', target: 'AR-004', type: 'derived_from' },
  { source: 'REQ-005', target: 'AR-005', type: 'derived_from' },
  { source: 'REQ-006', target: 'AR-002', type: 'derived_from' },
  { source: 'REQ-007', target: 'AR-008', type: 'derived_from' },
  { source: 'REQ-008', target: 'AR-010', type: 'derived_from' },
  { source: 'US-001', target: 'REQ-001', type: 'derived_from' },
  { source: 'US-002', target: 'REQ-002', type: 'derived_from' },
  { source: 'US-003', target: 'REQ-003', type: 'derived_from' },
  { source: 'US-004', target: 'REQ-004', type: 'derived_from' },
  { source: 'US-005', target: 'REQ-005', type: 'derived_from' },
  { source: 'US-006', target: 'REQ-006', type: 'derived_from' },
]

const concerns: LinkSpec[] = [
  {
    source: 'AMB-001',
    target: 'AR-010',
    type: 'concerns',
    targetQuote: 'within 2 seconds',
  },
  { source: 'AMB-002', target: 'AR-003', type: 'concerns' },
  {
    source: 'AMB-003',
    target: 'AR-005',
    type: 'concerns',
    targetQuote: 'reminds the student and the mentor',
  },
  { source: 'ASM-002', target: 'AR-003', type: 'concerns' },
  // The ends of these links are an item that the user refused and one that a later item replaced,
  // so each shows as a link that touches a settled item. ASM-001 has no link on purpose: it is the
  // item whose chain is empty.
  { source: 'ASM-003', target: 'AR-003', type: 'concerns' },
  { source: 'ASM-004', target: 'AR-007', type: 'concerns' },
  { source: 'CONF-001', target: 'AR-007', type: 'concerns' },
  { source: 'VAL-001', target: 'REQ-005', type: 'flags' },
  { source: 'VAL-002', target: 'REQ-007', type: 'flags' },
  { source: 'REQ-003', target: 'REQ-006', type: 'depends_on' },
  { source: 'US-003', target: 'US-006', type: 'depends_on' },
]

export const mentorPlatformLinkSpecs: LinkSpec[] = [...evidence, ...derivations, ...concerns]
