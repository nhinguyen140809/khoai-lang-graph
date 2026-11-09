import type { ArtifactItem } from '@/modules/artifact/entities/@x/trace'
import type { IssueKind, IssueLinkTypes } from '@/modules/workflow/entities/@x/trace'

import type { TraceLink } from '../../links/trace-links.types'

// A small project that holds one open issue of each kind, a closed one, the items they are about
// and the people they involve.

/** The issue kinds of the definition of version 1. */
export const definitionIssueKinds: IssueKind[] = [
  { kind: 'ambiguity_issue', statusField: 'status', openValues: ['open'] },
  { kind: 'conflict', statusField: 'status', openValues: ['open'] },
  { kind: 'validation_issue', statusField: 'status', openValues: ['open'] },
]

/** The link types of the issues of each kind, as the definition gives them. */
export const definitionLinkTypes: Record<string, IssueLinkTypes> = {
  ambiguity_issue: { about: ['concerns'], parties: [] },
  conflict: { about: ['concerns'], parties: ['involves'] },
  validation_issue: { about: ['flags'], parties: [] },
}

/** The titles of the kinds, as the content schemas give them. */
export const kindTitles: Record<string, string> = {
  ambiguity_issue: 'Point to clarify',
  conflict: 'Disagreement',
  validation_issue: 'Problem to solve',
  spec_requirement: 'Requirement',
  persona: 'Interviewee',
}

const agentOrigin = {
  actor: 'agent' as const,
  agent_role: 'analyst',
  user_id: null,
  run_id: null,
  step_id: null,
}

function item(
  id: string,
  kind: string,
  key: string,
  content: Record<string, unknown>,
): ArtifactItem {
  return {
    id,
    artifact_id: `artifact-${id}`,
    project_id: 'project-1',
    key,
    kind,
    parent_item_id: null,
    position: 1,
    outline_number: '1',
    schema_version: 1,
    version: 1,
    review_status: 'approved',
    created_by: agentOrigin,
    updated_by: agentOrigin,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    content,
  }
}

export const openAmbiguity = item('amb-1', 'ambiguity_issue', 'AMB-001', {
  title: 'Fast has no number',
  description: 'The word fast has no number to it.',
  status: 'open',
})
export const closedAmbiguity = item('amb-2', 'ambiguity_issue', 'AMB-002', {
  title: 'Settled',
  description: 'This one is settled.',
  status: 'resolved',
})
export const openConflict = item('conf-1', 'conflict', 'CONF-001', {
  title: 'Who approves a booking',
  description: 'The student and the librarian disagree on who approves a booking.',
  status: 'open',
})
export const openValidation = item('val-1', 'validation_issue', 'VAL-001', {
  title: 'A wrong count',
  description: 'The list of mentors counts one mentor twice.',
  status: 'open',
})
export const requirement = item('req-1', 'spec_requirement', 'REQ-001', {
  title: 'Search mentors',
})
export const student = item('per-1', 'persona', 'PER-001', { title: 'Minh' })
export const librarian = item('per-2', 'persona', 'PER-002', { title: 'Hoa' })

function link(
  id: string,
  sourceItemId: string,
  targetItemId: string,
  linkType: string,
  targetQuote: string | null = null,
): TraceLink {
  return {
    id,
    source_item_id: sourceItemId,
    target_item_id: targetItemId,
    link_type: linkType,
    target_version: 1,
    target_quote: targetQuote,
    source_quote: null,
    note: null,
  }
}

export const issueLinks: TraceLink[] = [
  link('l1', 'amb-1', 'req-1', 'concerns', 'within 2 seconds'),
  link('l2', 'conf-1', 'req-1', 'concerns'),
  link('l3', 'conf-1', 'per-1', 'involves'),
  link('l4', 'conf-1', 'per-2', 'involves'),
  link('l5', 'val-1', 'req-1', 'flags', 'the list of mentors'),
  // A link to an item that the project does not hold names no subject.
  link('l6', 'amb-1', 'gone-1', 'concerns'),
  // A closed issue keeps its links, but shows no entry.
  link('l7', 'amb-2', 'req-1', 'concerns'),
]

export const issueItems: ArtifactItem[] = [
  openAmbiguity,
  closedAmbiguity,
  openConflict,
  openValidation,
  requirement,
  student,
  librarian,
]
