// Sample data for the design system page, taken from the mentor platform example project.
import type { Edge, Node } from '@xyflow/react'

import { courses, type MotionDemoMotion } from '@/shared/components/act'
import type { LoadingLayout } from '@/shared/components/state'
import type { EdgeVariant, EdgeWeight } from '@/shared/components/ui/edge'
import type { NodeVariant } from '@/shared/components/ui/node'
import type { NodeStatus } from '@/shared/components/ui/node-status-indicator'
import type { Tone } from '@/shared/lib/tone'

import { keysOf, lookOf } from './design-system.utils'

export type Priority = 'must' | 'should' | 'could' | 'wont'

export interface SpecRequirementRow {
  key: string
  title: string
  priority: Priority
  status: 'approved' | 'draft' | 'needs review'
}

export const specRequirements: SpecRequirementRow[] = [
  { key: 'REQ-001', title: 'Search mentors by field', priority: 'must', status: 'approved' },
  {
    key: 'REQ-002',
    title: 'Filter mentors by availability',
    priority: 'should',
    status: 'approved',
  },
  { key: 'REQ-005', title: 'Book a 30-minute session', priority: 'must', status: 'needs review' },
  { key: 'REQ-007', title: 'Rate a finished session', priority: 'could', status: 'draft' },
  { key: 'REQ-009', title: 'Export the session history', priority: 'wont', status: 'draft' },
]

export const priorityLabels: Record<Priority, string> = {
  must: 'Must',
  should: 'Should',
  could: 'Could',
  wont: "Won't",
}

export const priorityCounts: { priority: Priority; count: number }[] = [
  { priority: 'must', count: 18 },
  { priority: 'should', count: 11 },
  { priority: 'could', count: 6 },
  { priority: 'wont', count: 3 },
]

export interface Persona {
  key: string
  name: string
  initials: string
  summary: string
}

export const personas: Persona[] = [
  {
    key: 'PER-001',
    name: 'Student',
    initials: 'ST',
    summary: 'Second-year student who needs a mentor',
  },
  {
    key: 'PER-002',
    name: 'Mentor',
    initials: 'MT',
    summary: 'Alumni engineer with two free hours a week',
  },
  {
    key: 'PER-003',
    name: 'Admin',
    initials: 'AD',
    summary: 'Faculty staff who approves new mentors',
  },
]

export interface ExplorerNode {
  name: string
  children?: string[]
}

/** The artifact tree of the example project, keyed by node id; `root` is the top. */
export const explorerNodes: Record<string, ExplorerNode> = {
  root: { name: 'Artifacts', children: ['plan', 'personas', 'analysis', 'spec', 'backlog'] },
  plan: { name: 'Interview plan' },
  personas: { name: 'Personas', children: ['per-1', 'per-2', 'per-3'] },
  'per-1': { name: 'PER-001 Student' },
  'per-2': { name: 'PER-002 Mentor' },
  'per-3': { name: 'PER-003 Admin' },
  analysis: { name: 'Requirements analysis', children: ['analyzed', 'conflicts'] },
  analyzed: { name: 'Analyzed requirements', children: ['ar-3', 'ar-7'] },
  'ar-3': { name: 'AR-003 Mentor search' },
  'ar-7': { name: 'AR-007 Layered booking flow' },
  conflicts: { name: 'Conflicts', children: ['conf-1'] },
  'conf-1': { name: 'CONF-001 Who approves a booking' },
  spec: { name: 'Requirement specification', children: ['sec-3'] },
  'sec-3': { name: '3 Functional requirements', children: ['sec-3-1', 'sec-3-2'] },
  'sec-3-1': { name: '3.1 Mentor discovery', children: ['req-1', 'req-2'] },
  'req-1': { name: 'REQ-001 Search mentors' },
  'req-2': { name: 'REQ-002 Filter by field' },
  'sec-3-2': { name: '3.2 Booking', children: ['req-5'] },
  'req-5': { name: 'REQ-005 Book a session' },
  backlog: { name: 'User stories' },
}

export interface TraceNodeData extends Record<string, unknown> {
  key: string
  title: string
  variant: NodeVariant
  color: Tone
  status: NodeStatus
}

export type TraceNode = Node<TraceNodeData, 'item'>

export const traceNodes: TraceNode[] = [
  {
    id: 'ar-3',
    type: 'item',
    position: { x: 100, y: 0 },
    data: {
      key: 'AR-003',
      title: 'Mentor search',
      variant: 'soft',
      color: 'success',
      status: 'initial',
    },
  },
  {
    id: 'req-1',
    type: 'item',
    position: { x: 100, y: 120 },
    data: {
      key: 'REQ-001',
      title: 'Search mentors by field',
      variant: 'soft',
      color: 'primary',
      status: 'loading',
    },
  },
  {
    id: 'req-2',
    type: 'item',
    position: { x: 0, y: 250 },
    data: {
      key: 'REQ-002',
      title: 'Filter mentors by availability',
      variant: 'outline',
      color: 'neutral',
      status: 'initial',
    },
  },
  {
    id: 'us-4',
    type: 'item',
    position: { x: 200, y: 250 },
    data: {
      key: 'US-004',
      title: 'Search mentors as a student',
      variant: 'solid',
      color: 'warning',
      status: 'initial',
    },
  },
]

export interface TraceEdgeData extends Record<string, unknown> {
  variant: EdgeVariant
  weight?: EdgeWeight | undefined
  color: Tone
}

export type TraceEdge = Edge<TraceEdgeData, 'link'>

export const traceEdges: TraceEdge[] = [
  {
    id: 'ar-3-req-1',
    type: 'link',
    source: 'ar-3',
    target: 'req-1',
    label: 'derived_from',
    animated: true,
    data: { variant: 'solid', color: 'primary' },
  },
  {
    id: 'req-1-req-2',
    type: 'link',
    source: 'req-1',
    target: 'req-2',
    label: 'depends_on',
    data: { variant: 'dashed', color: 'neutral' },
  },
  {
    id: 'req-1-us-4',
    type: 'link',
    source: 'req-1',
    target: 'us-4',
    label: 'derived_from',
    data: { variant: 'dotted', color: 'warning' },
  },
]

export const sampleMarkdown = [
  '### REQ-001 Search mentors',
  '',
  'The system shall let a student search mentors by **field** and **availability**.',
  '',
  '- Derived from `AR-003`',
  '- Depends on `REQ-002`',
  '',
  '| Key | Priority | Status |',
  '| --- | --- | --- |',
  '| REQ-001 | must | approved |',
  '| REQ-002 | should | draft |',
  '',
  '```ts',
  'export function searchMentors(field: string, from: Date): Mentor[] {',
  '  return mentors.filter((mentor) => mentor.fields.includes(field) && mentor.freeFrom <= from)',
  '}',
  '```',
].join('\n')

/** A message of an interview, with the words that items were taken from. */
export const interviewMessage =
  'I ask seniors in my club, but I never know who is free this week. I want to cancel without writing to anyone, and a reminder the hour before would help.'

/** The statement of REQ-001 at version 3 and at version 4, to read what the change marked. */
export const statementV3 =
  'The system shall let a student search mentors by field and availability.'
export const statementV4 =
  'The system shall let a student search and filter mentors by field, availability and rating.'

/** The rationale that version 4 of REQ-001 brought, which version 3 did not have. */
export const rationaleV4 = 'Students cannot find a free mentor today; many give up before asking.'

export interface QuotedItem {
  /** The words of the message that the item was taken from. */
  quote: string
  key: string
  title: string
  color: Tone
}

export const quotedItems: QuotedItem[] = [
  {
    quote: 'I ask seniors in my club',
    key: 'RAW-001',
    title: 'Ask seniors for advice',
    color: 'primary',
  },
  {
    quote: 'I never know who is free this week',
    key: 'RAW-002',
    title: 'See who is free',
    color: 'warning',
  },
  {
    quote: 'cancel without writing to anyone',
    key: 'RAW-003',
    title: 'Cancel a session alone',
    color: 'destructive',
  },
  {
    quote: 'a reminder the hour before',
    key: 'RAW-004',
    title: 'Remind before a session',
    color: 'success',
  },
]

/** A text that a search can mark in several places. */
export const searchText =
  'Mentors can search mentors by field and filter them by availability. Students book a session with a mentor, rate it, and export the history of their sessions.'

/** A step of the progress of the work, as the side panel of the activity draws it. */
export interface StepperStep {
  key: string
  title: string
  status: 'done' | 'running' | 'waiting' | 'failed' | 'stopped' | 'not_started'
  /** The steps under it, such as one for each interviewee; they show while the step is open. */
  subSteps?: StepperStep[]
}

export const stepperSteps: StepperStep[] = [
  { key: 'planning', title: 'Planning the interviews', status: 'done' },
  { key: 'personas', title: 'Proposing the interviewees', status: 'done' },
  {
    key: 'interviewing',
    title: 'Interviewing',
    status: 'running',
    subSteps: [
      { key: 'linh', title: 'Linh, a mentor', status: 'done' },
      { key: 'minh', title: 'Minh, a student', status: 'running' },
      { key: 'an', title: 'An, a parent', status: 'not_started' },
    ],
  },
  { key: 'analysis', title: 'Analysing the interviews', status: 'waiting' },
  { key: 'specification', title: 'Writing the specification', status: 'not_started' },
]

/** A row of the outline of the messages of the user, as the side panel of the activity draws it. */
export interface TimelineRow {
  key: string
  date: string
  title: string
  tone: 'primary' | 'warning' | 'neutral'
}

export const timelineRows: TimelineRow[] = [
  { key: 'm1', date: '2 Oct', title: 'I want to build an online platform...', tone: 'primary' },
  { key: 'm2', date: '4 Oct', title: 'Group sessions are needed too...', tone: 'primary' },
  { key: 'm3', date: '6 Oct', title: 'Also ask about group sessions.', tone: 'warning' },
]

/** A line of the work of the agents, as the chat of the activity draws it. */
export interface TraceRow {
  key: string
  title: string
  description: string
  status: 'done' | 'running' | 'waiting' | 'failed'
  tone: 'primary' | 'success' | 'warning' | 'destructive'
}

export const traceRows: TraceRow[] = [
  {
    key: 's1',
    title: 'Analysing the interviews',
    description: 'Took 1 minute   24 written',
    status: 'done',
    tone: 'success',
  },
  {
    key: 's2',
    title: 'Interviewing: Student',
    description: 'Working',
    status: 'running',
    tone: 'primary',
  },
  {
    key: 's3',
    title: 'Reviewing the analysis',
    description: 'Waiting for your review',
    status: 'waiting',
    tone: 'warning',
  },
  {
    key: 's4',
    title: 'Writing the specification',
    description: 'Failed: The work reached its budget.',
    status: 'failed',
    tone: 'destructive',
  },
]

/** A kind of the workflow as a block: its title, the icon its schema names, and what it is. */
interface BlockKind {
  kind: string
  title: string
  icon: string | null
  /** The documents are folders (they hold items); the items are pages of text. */
  look: 'folder' | 'text' | 'diagram'
}

/** The kinds of document of the workflow, each a folder when it holds items that open one by one. */
export const documentBlockKinds: BlockKind[] = [
  { kind: 'elicitation_plan', title: 'Interview plan', icon: 'compass', look: 'text' },
  { kind: 'research_corpus', title: 'Research corpus', icon: 'library', look: 'folder' },
  { kind: 'persona_catalog', title: 'Interviewees', icon: 'users', look: 'folder' },
  {
    kind: 'interview_transcript',
    title: 'Interview transcript',
    icon: 'messages-square',
    look: 'text',
  },
  { kind: 'requirements_analysis', title: 'Requirements analysis', icon: 'search', look: 'folder' },
  {
    kind: 'requirement_specification',
    title: 'Requirement specification',
    icon: 'file-check',
    look: 'folder',
  },
  { kind: 'product_backlog', title: 'User stories', icon: 'list-todo', look: 'folder' },
  { kind: 'validation_report', title: 'Verification report', icon: 'shield-check', look: 'folder' },
]

/** The kinds of item of the workflow, each a block of text that carries the icon of its kind. */
export const itemBlockKinds: BlockKind[] = [
  { kind: 'source_document', title: 'Research document', icon: 'file-text', look: 'text' },
  { kind: 'stakeholder_observation', title: 'Stakeholder observation', icon: 'eye', look: 'text' },
  { kind: 'persona', title: 'Interviewee', icon: 'user', look: 'text' },
  { kind: 'raw_requirement', title: 'Stated need', icon: 'message-square-quote', look: 'text' },
  {
    kind: 'analyzed_requirement',
    title: 'Analysed requirement',
    icon: 'list-checks',
    look: 'text',
  },
  { kind: 'latent_need', title: 'Unstated need', icon: 'lightbulb', look: 'text' },
  { kind: 'assumption', title: 'Assumption', icon: 'flag', look: 'text' },
  { kind: 'ambiguity_issue', title: 'Point to clarify', icon: 'circle-help', look: 'text' },
  { kind: 'conflict', title: 'Disagreement', icon: 'triangle-alert', look: 'text' },
  {
    kind: 'spec_requirement',
    title: 'Specified requirement',
    icon: 'clipboard-check',
    look: 'text',
  },
  { kind: 'backlog_item', title: 'User story', icon: 'list-todo', look: 'text' },
  { kind: 'validation_issue', title: 'Problem to solve', icon: 'shield-alert', look: 'text' },
]

// The orbits to see, each by its name: how it leans (tilt) and turns, how wide it goes, where it
// starts, how many things are on it and how fast it goes round.
export const orbitLooks: Record<string, MotionDemoMotion> = {
  flat: { copies: 1 },
  'flat, three': { copies: 3 },
  'leaned 30': { tilt: 30, copies: 2 },
  'leaned 65': { tilt: 65, copies: 2 },
  'leaned 80': { tilt: 80, copies: 3 },
  'leaned 65, turned 45': { tilt: 65, turn: 45, copies: 2 },
  'leaned 65, turned -45': { tilt: 65, turn: -45, copies: 2 },
  'leaned 80, turned 90': { tilt: 80, turn: 90, copies: 3 },
  wide: { tilt: 60, reach: 1.6, copies: 2 },
  tight: { reach: 0.6, copies: 2 },
  'five on a ring': { tilt: 55, turn: -20, copies: 5 },
  'from the top': { slot: 'top', tilt: 60, copies: 2 },
  'from the left': { slot: 'left', tilt: 70, copies: 2 },
  'fast, twice round': { tilt: 60, courseCycles: 2, copies: 2 },
}

// Where a thing may stand, each by its name: the nine slots, nearer and farther, and moved from a slot.
export const positionLooks: Record<string, MotionDemoMotion> = {
  'top-left': { slot: 'top-left' },
  top: { slot: 'top' },
  'top-right': { slot: 'top-right' },
  left: { slot: 'left' },
  'center (on the face)': { slot: 'center' },
  right: { slot: 'right' },
  'bottom-left': { slot: 'bottom-left' },
  bottom: { slot: 'bottom' },
  'bottom-right': { slot: 'bottom-right' },
  'right, distance 0.6': { slot: 'right', distance: 0.6 },
  'right, distance 1.5': { slot: 'right', distance: 1.5 },
  'top-right, distance 0.6 (over the corner)': { slot: 'top-right', distance: 0.6 },
  'top-left, distance 0.6 (over the corner)': { slot: 'top-left', distance: 0.6 },
  'bottom, distance 0.4 (over the chin)': { slot: 'bottom', distance: 0.4 },
  'top, distance 0.4 (over the brow)': { slot: 'top', distance: 0.4 },
  'center, large (covers the face)': { slot: 'center', size: 2.4 },
  'center, moved up (forehead)': { slot: 'center', offset: { x: 0, y: -0.3 } },
  'center, moved down (chin)': { slot: 'center', offset: { x: 0, y: 0.3 } },
  'center, moved to the side': { slot: 'center', offset: { x: 0.25, y: 0 } },
  'right, moved up': { slot: 'right', offset: { x: 0, y: -0.3 } },
}

/** The courses that go on as copies one after another, or as a ring, so that one copy shows nothing of them. */
const courseCopies: Partial<Record<keyof typeof courses, number>> = {
  orbit: 3,
  burst: 3,
  gather: 3,
}

/** The demonstrations of the courses, and of burst and gather turned to go sideways. */
export const courseLooks: Record<string, MotionDemoMotion> = {
  ...lookOf(keysOf(courses), (course) => ({
    course,
    courseCycles: course === 'orbit' ? 1 : 2,
    copies: courseCopies[course] ?? 1,
  })),
  'burst sideways': { course: 'burst', courseCycles: 2, copies: 3, axis: 'horizontal' },
  'gather sideways': { course: 'gather', courseCycles: 2, copies: 3, axis: 'horizontal' },
}

export const layouts: {
  layout: LoadingLayout
  rows: number
  columns?: number
  alternate?: boolean
  note: string
}[] = [
  { layout: 'lines', rows: 3, note: 'text rows' },
  {
    layout: 'lines',
    rows: 3,
    alternate: true,
    note: 'rows take turns at each side, as a chat does',
  },
  { layout: 'list', rows: 3, note: 'a mark and two lines' },
  { layout: 'cards', rows: 2, note: 'boxes with a title' },
  { layout: 'grid', rows: 1, columns: 3, note: 'blocks in columns' },
  { layout: 'table', rows: 3, columns: 3, note: 'rows of cells' },
  { layout: 'feed', rows: 2, note: 'entries with an avatar' },
  { layout: 'document', rows: 2, note: 'a heading and paragraphs' },
  { layout: 'detail', rows: 2, note: 'a title, tags and sections' },
]

// The layouts once each: a layout may show twice in the samples, with another option.
export const layoutNames = [...new Set(layouts.map((entry) => entry.layout))]

// The persona that an interview talks to: its face comes from its role and its name.
export const personaSeed = 'respondent/Minh'
