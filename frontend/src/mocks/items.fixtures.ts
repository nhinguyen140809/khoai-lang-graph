import type { Item } from '@/features/search'

import { artifactId, itemId, PROJECT_IDS } from './mock-ids.constants'

// Mock items of the mentor platform, in the kinds of the workflow definition:
// a backlog chain (US → REQ → AR → RAW), its personas, the interview message
// behind the raw need, and its one open issue. Every item carries the artifact
// it belongs to, so the Artifacts tree can hang under it.

function item(
  n: number,
  artifactN: number,
  key: string,
  kind: string,
  content: Item['content'],
  reviewStatus = 'draft',
): Item {
  return {
    id: itemId(n),
    project_id: PROJECT_IDS.mentor,
    artifact_id: artifactId(artifactN),
    key,
    kind,
    review_status: reviewStatus,
    content,
    version: 1,
    updated_at: '2026-10-02T09:02:11Z',
  }
}

/** Every item of the mock data, ordered by artifact then key. */
export const mockItems: Item[] = [
  item(3, 2, 'PER-001', 'persona', {
    name: 'Student',
    role: 'Undergraduate looking for a mentor',
    goals: ['Find a mentor in my field', 'Book a session in a few minutes'],
  }),
  item(4, 2, 'PER-002', 'persona', {
    name: 'Mentor',
    role: 'Lecturer who mentors on the side',
    goals: ['Set the hours I am free', 'Meet students who match my field'],
  }),
  item(5, 2, 'PER-003', 'persona', {
    name: 'Admin',
    role: 'Staff of the program',
    goals: ['See who mentors whom', 'Remove accounts that break the rules'],
  }),
  item(11, 3, 'PER-001#1', 'interview_message', {
    turn: 1,
    role: 'persona',
    content: "I never know who is free this week, so I give up and don't book.",
    iteration: 0,
    topic: null,
  }),
  item(
    1,
    4,
    'AMB-001',
    'ambiguity_issue',
    {
      title: '"Fast" search has no number',
      description: 'The interview asks for fast search without saying how fast.',
      severity: 'major',
    },
    'open',
  ),
  item(10, 4, 'LN-001', 'latent_need', {
    title: 'A student would like to see which mentors their friends liked.',
    description: 'None of the interviews asked for it, but it came up twice as a wish.',
    importance: 'should_have',
  }),
  item(12, 4, 'RAW-002', 'raw_requirement', {
    type: 'functional',
    statement: 'A student shall be able to search for mentors by field of study.',
    source: 'interview',
    topic: null,
  }),
  item(2, 4, 'AR-003', 'analyzed_requirement', {
    title: 'Students pick a mentor by field of study',
    statement: 'Students named finding a mentor in their field as their main problem.',
    category: 'need',
    status: 'confirmed',
    priority: 'must',
    rationale: 'Directly requested by students during elicitation; the core discovery need.',
  }),
  item(
    6,
    5,
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
  item(7, 5, 'REQ-002', 'spec_requirement', {
    title: 'Book a session',
    statement: 'The system shall let a student book a free hour of a mentor.',
    type: 'functional',
    priority: 'must',
    acceptance_criteria: ['A booked hour is no longer offered to other students'],
    verification_method: 'test',
  }),
  item(8, 5, 'REQ-003', 'spec_requirement', {
    title: 'Search speed',
    statement: 'The system shall list the results of a mentor search within 2 seconds.',
    type: 'non_functional',
    priority: 'should',
    fit_criterion: 'p95 <= 2 s for 1,000 mentors',
    verification_method: 'test',
  }),
  item(13, 6, 'US-004', 'backlog_item', {
    title: 'Search by field of study',
    user_story: 'As a student, I want to search mentors by field so that I find a fit quickly.',
    acceptance: ['Results are mentors of the field only'],
    status: 'ready',
    estimate: 5,
    priority: 'must',
    sprint: null,
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
