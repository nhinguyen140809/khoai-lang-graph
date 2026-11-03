import { artifactFixtures } from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '@/mocks/shared/db'
import { workflowDefinitionFixture } from '@/mocks/workflow/workflow.fixtures'
import { assertPresent } from '@/shared/lib/guards'

import type { DocumentMark } from '../types/documents.types'

export const mentorArtifacts = artifactFixtures.filter(
  ({ project_id }) => project_id === projectIds.mentor,
)

export function mentorArtifactOf(kind: string) {
  return assertPresent(
    mentorArtifacts.find((artifact) => artifact.kind === kind),
    `No mentor artifact of kind ${kind}`,
  )
}

export const definedKinds = workflowDefinitionFixture.artifact_kinds

export const titleFixtures = new Map(definedKinds.map(({ kind }) => [kind, `Title of ${kind}`]))

const analysis = mentorArtifactOf('requirements_analysis')
const plan = mentorArtifactOf('elicitation_plan')

export const markCases: {
  name: string
  artifact: { id: string; review_status: 'draft' | 'approved' | 'rejected' | 'superseded' }
  writing: string[]
  review: string[]
  mark: DocumentMark
}[] = [
  {
    name: 'writing before review and approval',
    artifact: { id: analysis.id, review_status: 'approved' },
    writing: [analysis.id],
    review: [analysis.id],
    mark: 'writing',
  },
  {
    name: 'review before approval',
    artifact: { id: analysis.id, review_status: 'approved' },
    writing: [],
    review: [analysis.id],
    mark: 'review',
  },
  {
    name: 'approved',
    artifact: { id: plan.id, review_status: 'approved' },
    writing: [],
    review: [],
    mark: 'approved',
  },
  {
    name: 'a draft',
    artifact: { id: plan.id, review_status: 'draft' },
    writing: [],
    review: [],
    mark: 'draft',
  },
  {
    name: 'a rejected artifact as a draft',
    artifact: { id: plan.id, review_status: 'rejected' },
    writing: [],
    review: [],
    mark: 'draft',
  },
]

export const groupMarkCases: { name: string; marks: DocumentMark[]; mark: DocumentMark }[] = [
  { name: 'no document', marks: [], mark: 'notStarted' },
  { name: 'writing first', marks: ['approved', 'review', 'writing'], mark: 'writing' },
  { name: 'review without writing', marks: ['approved', 'review', 'draft'], mark: 'review' },
  { name: 'all approved', marks: ['approved', 'approved'], mark: 'approved' },
  { name: 'a draft among approved', marks: ['approved', 'draft'], mark: 'draft' },
]
