import type { ArtifactSummary } from '@/features/artifacts'

import { artifactId, PROJECT_IDS } from './mock-ids.constants'

function artifact(
  n: number,
  kind: string,
  title: string,
  summary: string | null,
  content: ArtifactSummary['content'],
): ArtifactSummary {
  return {
    id: artifactId(n),
    project_id: PROJECT_IDS.mentor,
    kind,
    title,
    summary,
    schema_version: 1,
    version: 1,
    review_status: 'approved',
    content,
    updated_at: '2026-10-02T09:02:11Z',
  }
}

/** The artifacts of the mentor project, in the order the workflow wrote them. */
export const mockArtifacts: ArtifactSummary[] = [
  artifact(1, 'elicitation_plan', 'Elicitation plan', 'Mentors by field, three personas.', {
    objectives: ['Find what students and mentors need'],
    topics: ['mentors by field'],
    information_gaps: [],
    stakeholder_types: ['Students', 'Mentors', 'Admins'],
    strategies: ['Interview three personas'],
    stopping_conditions: ['Topics covered twice'],
  }),
  artifact(2, 'persona_catalog', 'Persona catalog', 'Student, Mentor, Admin', {
    selection_rationale: 'Three stakeholder types of the platform.',
    uncovered_stakeholder_types: [],
  }),
  artifact(3, 'interview_transcript', 'Interview of PER-001', 'The student interview', {
    status: 'completed',
    turn_count: 1,
    stop_reason: 'topics_covered',
  }),
  artifact(4, 'requirements_analysis', 'Requirements analysis', 'Needs, sources, issues', {
    key_findings: ['Students pick a mentor by field of study'],
    open_questions: ['How fast must search be?'],
  }),
  artifact(5, 'requirement_specification', 'Requirement specification', 'The requirements', {
    purpose: 'Let students find and book mentors.',
    scope: 'Search, profiles, booking.',
    out_of_scope: ['Payments'],
    definitions: [],
  }),
  artifact(6, 'product_backlog', 'Product backlog', 'The user stories', {
    product_goal: 'A working mentor platform for the semester.',
    prioritization_notes: 'Search before booking.',
  }),
  artifact(7, 'validation_report', 'Validation report', 'The checks of the backlog', {
    iteration: 1,
    status: 'pass',
  }),
]
