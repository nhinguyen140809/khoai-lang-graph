// Sample data for the design system page, taken from the mentor platform example project.

import type { Edge, Node } from '@xyflow/react'

import type { EdgeVariant } from '@/shared/components/ui/edge'
import type { NodeVariant } from '@/shared/components/ui/node'
import type { NodeStatus } from '@/shared/components/ui/node-status-indicator'
import type { Tone } from '@/shared/lib/tone'

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
  plan: { name: 'Elicitation plan' },
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
  backlog: { name: 'Product backlog' },
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
