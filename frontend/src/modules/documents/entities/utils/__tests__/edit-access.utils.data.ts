import { artifactFixtureByKind } from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '@/mocks/shared/db'
import type { RunStatus } from '@/modules/run/entities'

import type { EditAccess } from '../../types/documents.types'

const analysis = artifactFixtureByKind(projectIds.mentor, 'requirements_analysis')
const specification = artifactFixtureByKind(projectIds.mentor, 'requirement_specification')

/** A run status, an interrupt, the document asked about, and what the rule answers. */
export const editAccessCases: {
  name: string
  runStatus: RunStatus | undefined
  interrupt: { allow_edits: boolean; review_artifacts: { artifact_id: string; kind: string; title: string; version: number }[] } | null
  artifactId: string
  expected: EditAccess
}[] = [
  {
    name: 'a run that works',
    runStatus: 'running',
    interrupt: null,
    artifactId: analysis.id,
    expected: { canEdit: false, reason: 'agentsWorking' },
  },
  {
    name: 'a review that takes no changes',
    runStatus: 'interrupted',
    interrupt: { allow_edits: false, review_artifacts: [{ artifact_id: analysis.id, kind: analysis.kind, title: analysis.title, version: analysis.version }] },
    artifactId: analysis.id,
    expected: { canEdit: false, reason: 'reviewTakesNoChanges' },
  },
  {
    name: 'a review that does not list the document',
    runStatus: 'interrupted',
    interrupt: { allow_edits: true, review_artifacts: [{ artifact_id: analysis.id, kind: analysis.kind, title: analysis.title, version: analysis.version }] },
    artifactId: specification.id,
    expected: { canEdit: false, reason: 'notUnderReview' },
  },
  {
    name: 'a review that allows edits and lists the document',
    runStatus: 'interrupted',
    interrupt: { allow_edits: true, review_artifacts: [{ artifact_id: analysis.id, kind: analysis.kind, title: analysis.title, version: analysis.version }] },
    artifactId: analysis.id,
    expected: { canEdit: true },
  },
  {
    name: 'no run at all',
    runStatus: undefined,
    interrupt: null,
    artifactId: analysis.id,
    expected: { canEdit: false, reason: 'noReview' },
  },
  {
    name: 'a run that ended',
    runStatus: 'succeeded',
    interrupt: null,
    artifactId: analysis.id,
    expected: { canEdit: false, reason: 'noReview' },
  },
  {
    name: 'an interrupt not loaded yet',
    runStatus: 'interrupted',
    interrupt: null,
    artifactId: analysis.id,
    expected: { canEdit: false, reason: 'noReview' },
  },
]
