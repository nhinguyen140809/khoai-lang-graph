import type { Item } from '@/features/search'

import { extraItems } from './extra-projects.fixtures'
import { itemId, PROJECT_IDS } from './mock-ids.constants'

// Mock items: a good number of each kind for the mentor platform, a few for the other projects of
// the API examples, and a few for each generated project. The fields follow the content schemas.

function item(
  n: number,
  key: string,
  kind: string,
  content: Item['content'],
  reviewStatus = 'draft',
  project: string = PROJECT_IDS.mentor,
): Item {
  return {
    id: itemId(n),
    project_id: project,
    key,
    kind,
    review_status: reviewStatus,
    content,
    updated_at: '2026-10-02T09:02:11Z',
  }
}

const mentorItems: Item[] = [
  item(1, 'AMB-001', 'ambiguity', {
    title: '"Fast" results have no number',
    description: 'The interview asks for fast results without saying how fast.',
    severity: 'major',
  }),
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
  item(9, 'REQ-004', 'spec_requirement', {
    title: 'Cancel a session',
    statement: 'The system shall let a student cancel a booked session up to 12 hours before it.',
    type: 'functional',
    priority: 'must',
    verification_method: 'test',
  }),
  item(10, 'REQ-005', 'spec_requirement', {
    title: 'Remind before a session',
    statement: 'The system shall remind the student and the mentor 1 hour before a session.',
    type: 'functional',
    priority: 'should',
    verification_method: 'demonstration',
  }),
  item(11, 'REQ-006', 'spec_requirement', {
    title: 'Mentor availability',
    statement: 'The system shall let a mentor set the weekly hours when sessions can be booked.',
    type: 'functional',
    priority: 'must',
    verification_method: 'test',
  }),
  item(12, 'REQ-007', 'spec_requirement', {
    title: 'Group sessions',
    statement: 'The system shall let several students book one session of a mentor.',
    type: 'functional',
    priority: 'could',
    verification_method: 'test',
  }),
  item(13, 'REQ-008', 'spec_requirement', {
    title: 'Availability of the service',
    statement: 'The system shall be available 99.5% of the time each month.',
    type: 'non_functional',
    priority: 'should',
    fit_criterion: 'Uptime >= 99.5% per month',
    verification_method: 'analysis',
  }),
  item(14, 'RAW-001', 'raw_requirement', {
    title: 'Find a mentor in my field',
    statement: 'I want to find a mentor who works in my field of study.',
    source: 'PER-001#4',
  }),
  item(15, 'RAW-002', 'raw_requirement', {
    title: 'See who is free this week',
    statement: 'I never know who is free this week, so I give up.',
    source: 'PER-001#4',
  }),
  item(16, 'RAW-003', 'raw_requirement', {
    title: 'Reach the students that match',
    statement: 'I want students who match my field to find me.',
    source: 'PER-002#2',
  }),
  item(17, 'RAW-004', 'raw_requirement', {
    title: 'Approve who may be a mentor',
    statement: 'Someone must approve mentors before students can see them.',
    source: 'PER-003#6',
  }),
  item(18, 'AR-001', 'analysis_result', {
    title: 'Mentors are listed by field',
    statement: 'Students and mentors both describe a list of mentors grouped by field.',
    category: 'need',
  }),
  item(19, 'AR-002', 'analysis_result', {
    title: 'Free hours decide a booking',
    statement: 'A booking can only be made in an hour that the mentor marked as free.',
    category: 'constraint',
  }),
  item(20, 'AR-004', 'analysis_result', {
    title: 'Mentors need approval',
    statement: 'A mentor appears in the list only after the admin approved the account.',
    category: 'constraint',
  }),
  item(21, 'AR-005', 'analysis_result', {
    title: 'Sessions have a reminder',
    statement: 'Both sides want a reminder before a session.',
    category: 'need',
  }),
  item(22, 'LN-001', 'latent_need', {
    title: 'Trust in the mentor',
    statement:
      'Students hesitate to book a mentor they cannot judge; reviews or a profile may help.',
  }),
  item(23, 'ASM-001', 'assumption', {
    title: 'Every mentor has a university email',
    statement: 'Mentors sign in with an email of the university.',
  }),
  item(24, 'ASM-002', 'assumption', {
    title: 'A session lasts one hour',
    statement: 'The length of a session is fixed to one hour.',
  }),
  item(25, 'AMB-002', 'ambiguity', {
    title: 'Session length is not given',
    description: 'Two interviewees talk about a session without saying how long it is.',
    severity: 'minor',
  }),
  item(26, 'AMB-003', 'ambiguity', {
    title: '"Soon" before a session',
    description: 'The reminder should come "soon" before a session; the time is not given.',
    severity: 'minor',
  }),
  item(27, 'CONF-001', 'conflict', {
    title: 'Who approves a booking',
    description:
      'PER-001 wants a booking to be final at once; PER-003 wants the admin to approve it.',
  }),
  item(28, 'US-001', 'backlog_item', {
    title: 'Find a mentor by field',
    statement: 'As a student, I want to find a mentor by field, so that I get advice on my study.',
    delivery_status: 'todo',
  }),
  item(29, 'US-002', 'backlog_item', {
    title: 'Book a free hour',
    statement: 'As a student, I want to book a free hour of a mentor, so that I meet them.',
    delivery_status: 'in_progress',
  }),
  item(30, 'US-003', 'backlog_item', {
    title: 'Set my free hours',
    statement: 'As a mentor, I want to set my free hours, so that students book only those.',
    delivery_status: 'todo',
  }),
  item(31, 'US-004', 'backlog_item', {
    title: 'Get a reminder',
    statement: 'As a student, I want a reminder, so that I do not miss the session.',
    delivery_status: 'done',
  }),
  item(32, 'US-005', 'backlog_item', {
    title: 'Approve a mentor',
    statement: 'As an admin, I want to approve a mentor, so that only trusted people are listed.',
    delivery_status: 'todo',
  }),
  item(33, 'VAL-001', 'validation_issue', {
    title: 'REQ-005 has no acceptance criteria',
    description: 'The reminder requirement does not say how a tester sees that it works.',
    severity: 'major',
  }),
  item(34, 'VAL-002', 'validation_issue', {
    title: 'REQ-007 conflicts with the one hour session',
    description: 'A group session needs a longer hour than ASM-002 allows.',
    severity: 'minor',
  }),
]

const otherItems: Item[] = [
  item(
    40,
    'PER-001',
    'persona',
    { name: 'Hungry student', role: 'Orders lunch between classes' },
    'draft',
    PROJECT_IDS.campus,
  ),
  item(
    41,
    'PER-002',
    'persona',
    { name: 'Canteen cook', role: 'Prepares the orders' },
    'draft',
    PROJECT_IDS.campus,
  ),
  item(
    42,
    'PER-003',
    'persona',
    { name: 'Canteen manager', role: 'Sets the menu and the prices' },
    'draft',
    PROJECT_IDS.campus,
  ),
  item(
    43,
    'REQ-001',
    'spec_requirement',
    {
      title: 'Order from a menu',
      statement: 'The system shall let a student order dishes from the menu of a canteen.',
      type: 'functional',
      priority: 'must',
      verification_method: 'test',
    },
    'approved',
    PROJECT_IDS.campus,
  ),
  item(
    44,
    'REQ-002',
    'spec_requirement',
    {
      title: 'Pick up with a code',
      statement: 'The system shall give the student a code that the canteen scans at pick up.',
      type: 'functional',
      priority: 'must',
      verification_method: 'test',
    },
    'draft',
    PROJECT_IDS.campus,
  ),
  item(
    45,
    'REQ-003',
    'spec_requirement',
    {
      title: 'Peak hour orders',
      statement: 'The system shall take 200 orders in the ten minutes before noon.',
      type: 'non_functional',
      priority: 'should',
      fit_criterion: '200 orders in 10 minutes without an error',
      verification_method: 'analysis',
    },
    'draft',
    PROJECT_IDS.campus,
  ),
  item(
    46,
    'AR-001',
    'analysis_result',
    {
      title: 'Waiting in line is the problem',
      statement: 'Students lose their break waiting in line at the canteen.',
      category: 'need',
    },
    'draft',
    PROJECT_IDS.campus,
  ),
  item(
    50,
    'PER-001',
    'persona',
    { name: 'Student', role: 'Books a seat to study' },
    'draft',
    PROJECT_IDS.library,
  ),
  item(
    51,
    'PER-002',
    'persona',
    { name: 'Librarian', role: 'Keeps the rooms in order' },
    'draft',
    PROJECT_IDS.library,
  ),
  item(
    55,
    'PER-001',
    'persona',
    { name: 'Resident', role: 'Washes clothes in the dorm' },
    'approved',
    PROJECT_IDS.laundry,
  ),
  item(
    56,
    'REQ-001',
    'spec_requirement',
    {
      title: 'Book a machine',
      statement: 'The system shall let a resident book a washing machine for one hour.',
      type: 'functional',
      priority: 'must',
      verification_method: 'test',
    },
    'approved',
    PROJECT_IDS.laundry,
  ),
  item(
    57,
    'REQ-002',
    'spec_requirement',
    {
      title: 'Release an unused booking',
      statement: 'The system shall release a booking that nobody started within 10 minutes.',
      type: 'functional',
      priority: 'should',
      verification_method: 'test',
    },
    'approved',
    PROJECT_IDS.laundry,
  ),
]

/** Every item of the mock data, ordered by key within each project. */
export const mockItems: Item[] = [...mentorItems, ...otherItems, ...extraItems()]

/** The items of a project whose key or content contain `q`, ignoring case, ordered by key. */
export function searchMockItems(q: string, projectId: string): Item[] {
  const needle = q.toLowerCase()
  return mockItems
    .filter((entry) => entry.project_id === projectId)
    .filter(
      (entry) =>
        entry.key.toLowerCase().includes(needle) ||
        JSON.stringify(entry.content).toLowerCase().includes(needle),
    )
    .toSorted((a, b) => a.key.localeCompare(b.key))
}
