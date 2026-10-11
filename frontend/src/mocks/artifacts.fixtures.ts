import type { ArtifactSummary } from '@/features/artifacts'

import { artifactId, PROJECT_IDS } from './mock-ids.constants'

function artifact(n: number, kind: string, title: string, summary: string | null): ArtifactSummary {
  return {
    id: artifactId(n),
    project_id: PROJECT_IDS.mentor,
    kind,
    title,
    summary,
    schema_version: 1,
    version: 1,
    review_status: 'approved',
    updated_at: '2026-10-02T09:02:11Z',
  }
}

/** The artifacts of the mentor project, in the order the workflow wrote them. */
export const mockArtifacts: ArtifactSummary[] = [
  artifact(
    1,
    'elicitation_plan',
    'Elicitation plan',
    'Topics: mentors by field. 3 personas, 2 turns each.',
  ),
  artifact(2, 'persona_catalog', 'Persona catalog', 'Student, Mentor, Admin'),
  artifact(3, 'interview_transcript', 'Interview of PER-001', 'The student interview'),
  artifact(4, 'requirements_analysis', 'Requirements analysis', 'Analysed needs, sources, issues'),
  artifact(
    5,
    'requirement_specification',
    'Requirement specification',
    'The requirements of the platform',
  ),
  artifact(6, 'product_backlog', 'Product backlog', 'The user stories'),
  artifact(7, 'validation_report', 'Validation report', 'The checks of the backlog'),
]
