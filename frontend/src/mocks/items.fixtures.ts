import type { Item } from '@/features/search'

import { itemId, PROJECT_IDS } from './mock-ids.constants'

// Mock items of the mentor platform: a few of each kind, with the fields of the content schemas.

function item(
  n: number,
  key: string,
  kind: string,
  content: Item['content'],
  reviewStatus = 'draft',
): Item {
  return {
    id: itemId(n),
    project_id: PROJECT_IDS.mentor,
    key,
    kind,
    review_status: reviewStatus,
    content,
    updated_at: '2026-10-02T09:02:11Z',
  }
}

/** Every item of the mock data, ordered by key. */
export const mockItems: Item[] = [
  item(
    1,
    'AMB-001',
    'ambiguity',
    {
      title: '"Fast" search has no number',
      description: 'The interview asks for fast search without saying how fast.',
      severity: 'major',
    },
    'draft',
  ),
  item(2, 'AR-003', 'analysis_result', {
    title: 'Students pick a mentor by field of study',
    statement: 'Students named finding a mentor in their field as their main problem.',
    category: 'need',
  }),
  item(3, 'PER-001', 'persona', {
    name: 'Student',
    role: 'Undergraduate looking for a mentor',
    goals: ['Find a mentor in my field', 'Book a session in a few minutes'],
  }),
  item(4, 'PER-002', 'persona', {
    name: 'Mentor',
    role: 'Lecturer who mentors on the side',
    goals: ['Set the hours I am free', 'Meet students who match my field'],
  }),
  item(5, 'PER-003', 'persona', {
    name: 'Admin',
    role: 'Staff of the program',
    goals: ['See who mentors whom', 'Remove accounts that break the rules'],
  }),
  item(
    6,
    'REQ-001',
    'spec_requirement',
    {
      title: 'Search mentors',
      statement: 'The system shall let a student search mentors by field of study.',
      type: 'functional',
      priority: 'must',
      rationale: 'Students named finding a mentor in their field as their main problem.',
      acceptance_criteria: ['Searching by a field of study lists only mentors of that field'],
      fit_criterion: null,
      verification_method: 'test',
    },
    'approved',
  ),
  item(7, 'REQ-002', 'spec_requirement', {
    title: 'Book a session',
    statement: 'The system shall let a student book a free hour of a mentor.',
    type: 'functional',
    priority: 'must',
    acceptance_criteria: ['A booked hour is no longer offered to other students'],
    verification_method: 'test',
  }),
  item(8, 'REQ-003', 'spec_requirement', {
    title: 'Search speed',
    statement: 'The system shall list the results of a mentor search within 2 seconds.',
    type: 'non_functional',
    priority: 'should',
    fit_criterion: 'p95 <= 2 s for 1,000 mentors',
    verification_method: 'test',
  }),
]

/** The items whose key or content contain `q`, ignoring case. */
export function searchMockItems(q: string): Item[] {
  const needle = q.toLowerCase()
  return mockItems.filter(
    (entry) =>
      entry.key.toLowerCase().includes(needle) ||
      JSON.stringify(entry.content).toLowerCase().includes(needle),
  )
}
