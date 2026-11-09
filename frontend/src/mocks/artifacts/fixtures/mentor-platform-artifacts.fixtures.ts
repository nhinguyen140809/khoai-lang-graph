import type { ContentValues } from '@/modules/workflow/entities'

import type { ArtifactSpec, ItemSpec } from '../artifacts.types'

// The artifacts of the mentor platform, as the run of the API examples made them: the elicitation
// plan, the personas, one interview per persona, the requirements analysis, the requirement
// specification, the product backlog and the validation report.

const topics = ['search', 'booking', 'reminders', 'administration']
const stakeholderTypes = ['student', 'mentor', 'admin']

const elicitationPlan: ArtifactSpec = {
  kind: 'elicitation_plan',
  title: 'Interview plan',
  summary:
    'Three stakeholder types, four topics, and the questions to settle before the interviews end.',
  status: 'approved',
  version: 2,
  content: {
    objectives: [
      'Learn how students look for a mentor today',
      'Learn what a mentor needs to offer sessions',
      'Learn what the program needs to keep the service safe',
    ],
    topics,
    information_gaps: [
      'How long is a session?',
      'Who approves a mentor?',
      'How are reminders sent?',
    ],
    stakeholder_types: stakeholderTypes,
    strategies: [
      'Open questions first, then ask for examples',
      'Ask each persona about the same topics',
    ],
    stopping_conditions: [
      'Every topic was asked about',
      'No new requirement in the last three turns',
    ],
  },
  items: [],
}

const personaCatalog: ArtifactSpec = {
  kind: 'persona_catalog',
  title: 'Interviewees',
  summary: 'The mentor and the admin may disagree on who approves a booking.',
  status: 'approved',
  version: 2,
  content: {
    selection_rationale:
      'One persona for each stakeholder type, so that every side of a booking is heard.',
    uncovered_stakeholder_types: [],
  },
  items: [
    {
      key: 'PER-001',
      kind: 'persona',
      status: 'approved',
      content: {
        name: 'Minh',
        stakeholder_type: 'student',
        background: 'Third-year undergraduate who wants advice on a research career.',
        expertise: 'Knows the courses of the faculty, not the people behind them.',
        goals: ['Find a mentor in my field', 'Book a session in a few minutes'],
        interests: ['Research', 'Internships'],
        constraints: ['Free only between classes'],
        priorities: ['Speed', 'Trust in the mentor'],
        concerns: ['Not knowing who is free this week'],
        behavioral_tendencies: 'Gives up when a task takes more than a few steps.',
        interview_status: 'completed',
      },
    },
    {
      key: 'PER-002',
      kind: 'persona',
      status: 'approved',
      content: {
        name: 'Lan',
        stakeholder_type: 'mentor',
        background: 'Lecturer who mentors students next to teaching.',
        expertise: 'Ten years in the field, no time for administration.',
        goals: ['Set the hours I am free', 'Meet students who match my field'],
        interests: ['Teaching'],
        constraints: ['Free two afternoons a week'],
        priorities: ['Control over my hours'],
        concerns: ['Students who book and do not come'],
        behavioral_tendencies: 'Answers short and wants a reminder for everything.',
        interview_status: 'completed',
      },
    },
    {
      key: 'PER-003',
      kind: 'persona',
      status: 'approved',
      content: {
        name: 'Tuan',
        stakeholder_type: 'admin',
        background: 'Staff of the mentoring program.',
        expertise: 'Knows the rules of the program and the complaints of past years.',
        goals: ['See who mentors whom', 'Remove accounts that break the rules'],
        interests: ['Quality of the program'],
        constraints: ['Has to report to the dean each term'],
        priorities: ['Safety', 'Reports'],
        concerns: ['Bookings that nobody approved'],
        behavioral_tendencies: 'Wants a record of every decision.',
        interview_status: 'completed',
      },
    },
  ],
}

type Turn = [saidBy: 'interviewer' | 'persona', content: string, topic: string | null]

// A question and its answer share one turn.
function turnOf(index: number): number {
  return Math.floor(index / 2) + 1
}

function interview(
  personaKey: string,
  personaName: string,
  summary: string,
  turns: Turn[],
): ArtifactSpec {
  const turnCount = turnOf(turns.length - 1)
  return {
    kind: 'interview_transcript',
    title: `Interview with ${personaName}`,
    summary,
    status: 'approved',
    subjectKey: personaKey,
    content: {
      participants: [
        { key: 'interviewer', name: 'Interviewer', role: 'interviewer', item_id: null },
        { key: personaKey, name: personaName, role: 'persona', item_id: null },
      ],
      status: 'completed',
      turn_count: turnCount,
      stop_reason: 'stopping_condition_met',
    },
    // A message names its speaker by the key of its participant.
    items: turns.map(([saidBy, content, topic], index) => ({
      key: `${personaKey}#${String(index + 1)}`,
      kind: 'interview_message',
      status: 'approved',
      content: {
        turn: turnOf(index),
        speaker: saidBy === 'interviewer' ? 'interviewer' : personaKey,
        content,
        iteration: 0,
        topic,
      },
    })),
  }
}

const interviews: ArtifactSpec[] = [
  interview(
    'PER-001',
    'Minh',
    'The student gives up when no mentor is free this week, and wants to book and cancel without writing to anyone.',
    [
      ['interviewer', 'How do you look for a mentor today?', 'search'],
      [
        'persona',
        'I ask seniors in my club, but I never know who is free this week, so I give up.',
        'search',
      ],
      ['interviewer', 'What would make you book a session?', 'booking'],
      [
        'persona',
        'If I see the free hours of a mentor in my field and can book in one click.',
        'booking',
      ],
      ['interviewer', 'What if you cannot come?', 'booking'],
      [
        'persona',
        'I want to cancel without writing to anyone, and I want a reminder the hour before.',
        'reminders',
      ],
      ['interviewer', 'How fast should the search be?', 'search'],
      [
        'persona',
        'Fast. I do not wait for a page that takes more than a couple of seconds.',
        'search',
      ],
    ],
  ),
  interview(
    'PER-002',
    'Lan',
    'The mentor offers two afternoons a week, sessions of an hour, and wants a reminder for both sides.',
    [
      ['interviewer', 'How would you offer your time to students?', 'booking'],
      [
        'persona',
        'I can give two afternoons a week. I need to say which hours, and nothing else.',
        'booking',
      ],
      ['interviewer', 'How long is a session?', 'booking'],
      ['persona', 'About an hour, and I do not want back-to-back sessions.', 'booking'],
      ['interviewer', 'What about students who do not show up?', 'reminders'],
      [
        'persona',
        'A reminder to both of us would help. Sometimes I also want to see several students at once.',
        'reminders',
      ],
    ],
  ),
  interview(
    'PER-003',
    'Tuan',
    'The admin wants to approve the mentors and, in the first year, every booking.',
    [
      ['interviewer', 'Who decides which mentors are listed?', 'administration'],
      [
        'persona',
        'I do. A mentor must be approved before a student can see the profile.',
        'administration',
      ],
      ['interviewer', 'And a booking?', 'booking'],
      ['persona', 'I would like to approve a booking too, at least in the first year.', 'booking'],
      ['interviewer', 'What do you report each term?', 'administration'],
      ['persona', 'The number of sessions per mentor and the complaints.', 'administration'],
      ['interviewer', 'How do you want to find a problem account?', 'administration'],
      [
        'persona',
        'A list of the accounts with complaints, and a button to suspend one.',
        'administration',
      ],
    ],
  ),
]

const raw = (key: string, title: string, statement: string, topic: string): ItemSpec => ({
  key,
  kind: 'raw_requirement',
  content: { title, statement, topic },
})

const analyzed = (
  key: string,
  title: string,
  statement: string,
  type: string,
  priority: string,
  rationale: string,
  qualityCategory: string | null = null,
  version = 1,
): ItemSpec => ({
  key,
  kind: 'analyzed_requirement',
  version,
  content: { title, statement, type, quality_category: qualityCategory, priority, rationale },
})

const requirementsAnalysis: ArtifactSpec = {
  kind: 'requirements_analysis',
  title: 'Requirements analysis',
  summary:
    'From three interviews: 8 stated needs, 10 analysed requirements, 2 unstated needs, 4 assumptions, 3 points to clarify and 1 disagreement.',
  version: 4,
  content: {
    key_findings: [
      'Students and mentors both want to see free hours before they book.',
      'The admin wants to approve mentors, and maybe bookings.',
    ],
    open_questions: ['Does a booking need the approval of the admin?', 'How long is a session?'],
  },
  items: [
    raw(
      'RAW-001',
      'Find a mentor in my field',
      'I want to find a mentor who works in my field of study.',
      'search',
    ),
    raw(
      'RAW-002',
      'See who is free this week',
      'I never know who is free this week, so I give up.',
      'search',
    ),
    raw(
      'RAW-003',
      'Cancel without writing',
      'I want to cancel a session without writing to anyone.',
      'booking',
    ),
    raw(
      'RAW-004',
      'Reminder before a session',
      'I want a reminder the hour before a session.',
      'reminders',
    ),
    raw(
      'RAW-005',
      'Offer two afternoons a week',
      'I can give two afternoons a week; I say which hours.',
      'booking',
    ),
    raw(
      'RAW-006',
      'See several students at once',
      'I sometimes want to see several students at once.',
      'booking',
    ),
    raw(
      'RAW-007',
      'Approve mentors first',
      'A mentor must be approved before students can see the profile.',
      'administration',
    ),
    raw('RAW-008', 'Approve a booking too', 'I would like to approve a booking too.', 'booking'),
    analyzed(
      'AR-001',
      'List mentors by field',
      'The system lists mentors by field of study.',
      'functional',
      'must',
      'Students look for a mentor in their field.',
    ),
    analyzed(
      'AR-002',
      'Weekly hours of a mentor',
      'A mentor sets the weekly hours when sessions can be booked.',
      'functional',
      'must',
      'Mentors give a few afternoons a week.',
    ),
    analyzed(
      'AR-003',
      'Search with free hours',
      'A student searches mentors by field and sees their free hours.',
      'functional',
      'must',
      'Not knowing who is free makes students give up.',
    ),
    analyzed(
      'AR-004',
      'Cancel a booked session',
      'A student cancels a booked session without contacting the mentor.',
      'functional',
      'must',
      'Cancelling should take no effort.',
    ),
    analyzed(
      'AR-005',
      'Remind both sides',
      'The system reminds the student and the mentor before a session.',
      'functional',
      'should',
      'Both sides asked for it.',
    ),
    analyzed(
      'AR-006',
      'Approved mentors only',
      'A mentor is listed only after the admin approved the account.',
      'constraint',
      'must',
      'The admin owns the list of mentors.',
    ),
    analyzed(
      'AR-007',
      'Two-step booking',
      'A booking runs in two layers: a request, then the approval of the mentor or the admin.',
      'functional',
      'must',
      'The admin wants control over bookings.',
      null,
      2,
    ),
    analyzed(
      'AR-008',
      'Group sessions',
      'A mentor may allow several students in one session.',
      'functional',
      'could',
      'One mentor wants group sessions.',
    ),
    analyzed(
      'AR-009',
      'Reminder by email',
      'The system sends the reminder of a session by email.',
      'functional',
      'should',
      'Email is the channel everyone reads.',
    ),
    analyzed(
      'AR-010',
      'Search within 2 seconds',
      'A search result is listed within 2 seconds.',
      'non_functional',
      'should',
      'Students leave a slow page.',
      'performance',
    ),
    {
      key: 'LN-001',
      kind: 'latent_need',
      content: {
        title: 'Trust before booking',
        description: 'Students need to trust a mentor before they book.',
        reasoning: 'Two interviewees asked who the mentor is before they asked about time.',
        confidence: 'medium',
        disposition: 'open',
      },
    },
    {
      key: 'LN-002',
      kind: 'latent_need',
      content: {
        title: 'Record of every decision',
        description: 'The admin needs a record of every decision for the report of the term.',
        reasoning: 'The admin asked for a record, a list and a number for every task.',
        confidence: 'high',
        disposition: 'promoted',
      },
    },
    {
      key: 'ASM-001',
      kind: 'assumption',
      content: {
        title: 'Mentors have a university email',
        statement: 'Every mentor has an email of the university.',
        reasoning: 'Mentors are lecturers.',
        impact_if_wrong: 'Reminders cannot be sent to some mentors.',
        validation_status: 'unverified',
      },
    },
    {
      key: 'ASM-002',
      kind: 'assumption',
      content: {
        title: 'A session lasts one hour',
        statement: 'A session lasts one hour.',
        reasoning: 'Two interviewees said about an hour.',
        impact_if_wrong: 'The hours that a mentor sets would not fit the sessions.',
        validation_status: 'unverified',
      },
    },
    {
      key: 'ASM-003',
      kind: 'assumption',
      content: {
        title: 'University sign-in',
        statement: 'Students sign in with the account of the university.',
        reasoning: 'The platform is only for the students of one university.',
        impact_if_wrong: 'The platform needs its own sign-up.',
        validation_status: 'confirmed',
      },
    },
    {
      key: 'ASM-004',
      kind: 'assumption',
      content: {
        title: 'The admin approves every booking',
        statement: 'Every booking waits for the approval of the admin.',
        reasoning: 'The first plan gave the admin control over every booking.',
        impact_if_wrong: 'Bookings would wait for the admin.',
        validation_status: 'invalidated',
      },
    },
    {
      key: 'AMB-001',
      kind: 'ambiguity_issue',
      content: {
        title: 'Where "2 seconds" comes from',
        description:
          'The interviews say only "a couple of seconds"; the requirement names 2, and the quote marks the place.',
        ambiguity_type: 'vague',
        ambiguous_text: 'Fast. I do not wait for a page that takes more than a couple of seconds.',
        clarifying_question: 'How many seconds are too many, and for how many mentors?',
        status: 'open',
        resolution: null,
      },
    },
    {
      key: 'AMB-002',
      kind: 'ambiguity_issue',
      content: {
        title: 'Session length unknown',
        description: 'The length of a session is not given.',
        ambiguity_type: 'incomplete',
        ambiguous_text: 'About an hour, and I do not want back-to-back sessions.',
        clarifying_question: 'Is the length fixed, or does the mentor choose it?',
        status: 'open',
        resolution: null,
      },
    },
    {
      key: 'AMB-003',
      kind: 'ambiguity_issue',
      content: {
        title: 'Reminder channel unnamed',
        description: 'The reminder comes "the hour before"; the channel is not named.',
        ambiguity_type: 'incomplete',
        ambiguous_text: 'I want a reminder the hour before.',
        clarifying_question: 'By email, in the app, or both?',
        status: 'resolved',
        resolution: 'By email.',
      },
    },
    {
      key: 'CONF-001',
      kind: 'conflict',
      content: {
        title: 'Who approves a booking',
        description: 'PER-001 and PER-003 disagree on who approves a booking.',
        conflict_type: 'between_stakeholders',
        severity: 'high',
        proposed_resolutions: [
          'A layered flow: the mentor accepts, the admin only sees the booking',
          'The admin approves every booking in the first year',
        ],
        status: 'open',
        resolution: null,
      },
    },
  ],
}

const sectionItem = (
  key: string,
  title: string,
  introduction: string | null,
  children: ItemSpec[] = [],
): ItemSpec => ({
  key,
  kind: 'section',
  status: 'approved',
  content: { title, introduction },
  children,
})

const requirement = (
  key: string,
  title: string,
  statement: string,
  type: string,
  priority: string,
  verification: string,
  extra: Record<string, unknown> = {},
  version = 1,
): ItemSpec => ({
  key,
  kind: 'spec_requirement',
  status: 'approved',
  version,
  content: {
    title,
    statement,
    type,
    quality_category: null,
    priority,
    rationale: 'Taken from the analysis of the interviews.',
    acceptance_criteria: [],
    fit_criterion: null,
    verification_method: verification,
    ...extra,
  },
})

const requirementSpecification: ArtifactSpec = {
  kind: 'requirement_specification',
  title: 'Requirement specification',
  summary: '10 requirements for the mentoring platform: 7 functional and 3 non-functional.',
  status: 'approved',
  version: 2,
  content: {
    purpose: 'Help university students find and book mentors.',
    scope: 'Mentor discovery, booking, reminders and the administration of mentors.',
    out_of_scope: ['Payments', 'Video calls'],
    definitions: [
      { term: 'Mentor', definition: 'A lecturer who offers sessions to students.' },
      { term: 'Session', definition: 'One booked hour between a mentor and a student.' },
    ],
  },
  items: [
    sectionItem('SEC-001', 'Introduction', 'What the platform is for.'),
    sectionItem('SEC-002', 'Overall description', 'The users and the setting of the platform.'),
    sectionItem('SEC-003', 'Functional requirements', null, [
      sectionItem('SEC-004', 'Mentor discovery', 'How a student finds a mentor.', [
        requirement(
          'REQ-001',
          'Search mentors',
          'The system shall let a student search mentors by field of study.',
          'functional',
          'must',
          'test',
          {
            rationale: 'Students named finding a mentor in their field as their main problem.',
            acceptance_criteria: ['Searching by a field of study lists only mentors of that field'],
          },
          3,
        ),
        requirement(
          'REQ-002',
          'Filter by field and availability',
          'The system shall let a student filter mentors by field and by free hours.',
          'functional',
          'must',
          'test',
          {
            acceptance_criteria: [
              'Results within 2 seconds for 1,000 mentors',
              'Filters for field and availability',
            ],
          },
          2,
        ),
      ]),
      sectionItem('SEC-005', 'Booking', 'How a student books and cancels a session.', [
        requirement(
          'REQ-003',
          'Book a session',
          'The system shall let a student book a free hour of a mentor.',
          'functional',
          'must',
          'test',
          { acceptance_criteria: ['A booked hour is no longer offered to other students'] },
        ),
        requirement(
          'REQ-004',
          'Cancel a session',
          'The system shall let a student cancel a booked session up to 12 hours before it.',
          'functional',
          'must',
          'test',
        ),
        requirement(
          'REQ-005',
          'Remind before a session',
          'The system shall remind the student and the mentor 1 hour before a session.',
          'functional',
          'should',
          'demonstration',
        ),
      ]),
      sectionItem('SEC-006', 'Mentor profile', 'What a mentor controls.', [
        requirement(
          'REQ-006',
          'Mentor availability',
          'The system shall let a mentor set the weekly hours when sessions can be booked.',
          'functional',
          'must',
          'test',
        ),
        requirement(
          'REQ-007',
          'Group sessions',
          'The system shall let a mentor allow several students in one session.',
          'functional',
          'could',
          'test',
        ),
      ]),
    ]),
    sectionItem('SEC-007', 'Non-functional requirements', null, [
      requirement(
        'REQ-008',
        'Search speed',
        'The system shall list the results of a mentor search within 2 seconds.',
        'non_functional',
        'should',
        'test',
        { quality_category: 'performance', fit_criterion: 'p95 <= 2 s for 1,000 mentors' },
      ),
      requirement(
        'REQ-009',
        'Availability of the service',
        'The system shall be available 99.5% of the time each month.',
        'non_functional',
        'should',
        'analysis',
        { quality_category: 'reliability', fit_criterion: 'Uptime >= 99.5% per month' },
      ),
      requirement(
        'REQ-010',
        'Privacy of the students',
        'The system shall show the name of a student only to the mentor of a booked session.',
        'non_functional',
        'must',
        'inspection',
        {
          quality_category: 'security',
          fit_criterion: 'No page lists a student to another student',
        },
      ),
    ]),
  ],
}

const story = (
  key: string,
  title: string,
  role: string,
  want: string,
  why: string,
  priority: string,
  points: number | null,
  status: string,
): ItemSpec => ({
  key,
  kind: 'backlog_item',
  content: {
    item_type: 'user_story',
    title,
    as_a: role,
    i_want: want,
    so_that: why,
    acceptance_criteria: [
      {
        given: 'A mentor with free hours',
        when: `The student ${want.toLowerCase()}`,
        then: 'The result is shown at once',
      },
    ],
    priority,
    story_points: points,
    delivery_status: status,
  },
})

const productBacklog: ArtifactSpec = {
  kind: 'product_backlog',
  title: 'User stories',
  summary: '2 epics and 6 user stories, ordered by priority.',
  content: {
    product_goal: 'A student books a mentor in a few minutes.',
    prioritization_notes: 'Discovery and booking first; group sessions last.',
  },
  items: [
    {
      key: 'EP-001',
      kind: 'backlog_item',
      content: {
        item_type: 'epic',
        title: 'Find a mentor',
        as_a: null,
        i_want: null,
        so_that: null,
        acceptance_criteria: [],
        priority: 'must',
        story_points: null,
        delivery_status: 'in_progress',
      },
      children: [
        story(
          'US-001',
          'Search mentors by field',
          'student',
          'Search mentors by field',
          'I get advice on my study',
          'must',
          3,
          'done',
        ),
        story(
          'US-002',
          'Filter by free hours',
          'student',
          'Filter mentors by free hours',
          'I only see mentors I can meet',
          'must',
          5,
          'in_progress',
        ),
      ],
    },
    {
      key: 'EP-002',
      kind: 'backlog_item',
      content: {
        item_type: 'epic',
        title: 'Book a session',
        as_a: null,
        i_want: null,
        so_that: null,
        acceptance_criteria: [],
        priority: 'must',
        story_points: null,
        delivery_status: 'todo',
      },
      children: [
        story(
          'US-003',
          'Book a free hour',
          'student',
          'Book a free hour of a mentor',
          'I meet the mentor',
          'must',
          5,
          'todo',
        ),
        story(
          'US-004',
          'Cancel a booking',
          'student',
          'Cancel a booking',
          'I do not block the hour',
          'must',
          2,
          'todo',
        ),
        story(
          'US-005',
          'Get a reminder',
          'student',
          'Get a reminder',
          'I do not miss the session',
          'should',
          3,
          'todo',
        ),
        story(
          'US-006',
          'Set my free hours',
          'mentor',
          'Set my free hours',
          'students book only those',
          'must',
          3,
          'todo',
        ),
      ],
    },
  ],
}

const validationReport: ArtifactSpec = {
  kind: 'validation_report',
  title: 'Verification report',
  summary: '2 issues: 1 high, 1 low.',
  content: { iteration: 0, status: 'fail' },
  items: [
    {
      key: 'VAL-001',
      kind: 'validation_issue',
      content: {
        category: 'specification',
        severity: 'high',
        title: 'REQ-005 lacks acceptance criteria',
        description: 'REQ-005 has no acceptance criteria.',
        suggestion: 'Say how a tester sees that the reminder was sent.',
        status: 'open',
      },
    },
    {
      key: 'VAL-002',
      kind: 'validation_issue',
      content: {
        category: 'analysis',
        severity: 'low',
        title: 'REQ-007 outgrows the one-hour session',
        description: 'REQ-007 needs a longer hour than ASM-002 allows.',
        suggestion: 'Decide the length of a session first (AMB-002).',
        status: 'open',
      },
    },
  ],
}

// The analysis is still under review, but the user has begun: some items are approved, some are
// refused, and some were replaced by a later item, so that a document shows every state of an item
// next to the drafts.
const analysisReview: Record<string, 'approved' | 'rejected' | 'superseded'> = {
  'RAW-001': 'approved',
  'RAW-002': 'approved',
  'RAW-008': 'rejected',
  'AR-001': 'approved',
  'AR-002': 'approved',
  'AR-009': 'superseded',
  'LN-001': 'superseded',
  'LN-002': 'rejected',
  'ASM-003': 'rejected',
  'ASM-004': 'superseded',
}

function withReview(specs: ItemSpec[]): ItemSpec[] {
  return specs.map((spec) => ({
    ...spec,
    ...(analysisReview[spec.key] !== undefined && { status: analysisReview[spec.key] }),
    ...(spec.children !== undefined && { children: withReview(spec.children) }),
  }))
}

export const mentorArtifactSpecs: ArtifactSpec[] = [
  elicitationPlan,
  personaCatalog,
  ...interviews,
  { ...requirementsAnalysis, items: withReview(requirementsAnalysis.items) },
  requirementSpecification,
  productBacklog,
  validationReport,
]

/** The items that the user edited, with their version now. */
export const mentorEditedKeys: Record<string, number> = {
  'AR-007': 2,
  'AR-003': 2,
  'RAW-004': 3,
  'REQ-002': 2,
}

/**
 * The content of each item the user edited, before the edits: the first entry was what the agents
 * wrote, and the ones after it were the user's earlier edits, oldest first. The last version holds
 * the content of the fixture, so a history shows real changes.
 */
export const mentorEditedBefore: Record<string, ContentValues[]> = {
  'AR-007': [
    {
      title: 'Two-step booking',
      statement: 'A booking is a request the mentor confirms.',
      type: 'functional',
      quality_category: null,
      priority: 'must',
      rationale: 'The admin wants control over bookings.',
    },
  ],
  'AR-003': [
    {
      title: 'Search with free hours',
      statement: 'A student sees the free hours of mentors.',
      type: 'functional',
      quality_category: null,
      priority: 'must',
      rationale: 'Not knowing who is free makes students give up.',
    },
  ],
  'RAW-004': [
    {
      title: 'Reminder before a session',
      statement: 'I want a reminder before a session.',
      topic: 'reminders',
    },
    {
      title: 'Reminder before a session',
      statement: 'I want a reminder some time before a session.',
      topic: 'reminders',
    },
  ],
  'REQ-002': [
    {
      title: 'Filter by field and availability',
      statement: 'The system shall let a student filter mentors by field of study.',
      type: 'functional',
      quality_category: null,
      priority: 'must',
      rationale: 'Taken from the analysis of the interviews.',
      acceptance_criteria: [],
      fit_criterion: null,
      verification_method: 'test',
    },
  ],
}

/** The content of each artifact the agents reworked, before the rework, oldest first. */
export const mentorArtifactBefore: Record<string, ContentValues[]> = {
  'Interview plan': [
    {
      objectives: [
        'Learn how students look for a mentor today',
        'Learn what a mentor needs to offer sessions',
        'Learn what the program needs to keep the service safe',
      ],
      topics,
      information_gaps: ['How long is a session?', 'Who approves a mentor?'],
      stakeholder_types: stakeholderTypes,
      strategies: [
        'Open questions first, then ask for examples',
        'Ask each persona about the same topics',
      ],
      stopping_conditions: [
        'Every topic was asked about',
        'No new requirement in the last three turns',
      ],
    },
  ],
  Interviewees: [
    {
      selection_rationale: 'One persona for each stakeholder type of the program.',
      uncovered_stakeholder_types: [],
    },
  ],
  'Requirements analysis': [
    {
      key_findings: ['Students want to see free hours before they book.'],
      open_questions: ['How long is a session?'],
    },
    {
      key_findings: [
        'Students want to see free hours before they book.',
        'The admin wants to approve mentors.',
      ],
      open_questions: ['How long is a session?'],
    },
    {
      key_findings: [
        'Students want to see free hours before they book.',
        'The admin wants to approve mentors.',
      ],
      open_questions: ['How long is a session?', 'Does a booking need the approval of the admin?'],
    },
  ],
  'Requirement specification': [
    {
      purpose: 'Help university students find and book mentors.',
      scope: 'Mentor discovery, booking, reminders and the administration of mentors.',
      out_of_scope: ['Payments', 'Video calls'],
      definitions: [{ term: 'Mentor', definition: 'A lecturer who offers sessions to students.' }],
    },
  ],
}
