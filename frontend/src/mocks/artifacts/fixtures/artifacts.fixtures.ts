import type { Artifact, ArtifactItem } from '@/modules/artifact/entities'
import { assertPresent } from '@/shared/lib/guards'

import { generatedProjectSpecs } from '../../generated/fixtures/generated-project-specs.fixtures'
import { IdPrefix, mockId, projectIds, runIds } from '../../shared/db'
import type { ArtifactSpec, BuiltProject, ItemSpec } from '../artifacts.types'
import { buildProjectArtifacts } from './artifact-builder.fixtures'
import { mentorArtifactSpecs, mentorEditedKeys } from './mentor-platform-artifacts.fixtures'

// The artifacts and the items of the mock projects. The mentor platform has the whole set that the
// run of the API examples made; the other projects have a plan, personas and a short
// specification.

interface SimpleProject {
  n: number
  projectId: string
  runId: string
  day: string
  personas: [string, string]
  requirements: [string, string, string]
}

const section = (key: string, title: string, children: ItemSpec[]): ItemSpec => ({
  key,
  kind: 'section',
  content: { title, introduction: null },
  children,
})

/** An elicitation plan, a persona catalog and a short specification. */
function simpleSpecs({ personas, requirements }: SimpleProject): ArtifactSpec[] {
  const plan: ArtifactSpec = {
    kind: 'elicitation_plan',
    title: 'Elicitation plan',
    summary: 'Two stakeholder types and the topics to ask about.',
    status: 'approved',
    content: {
      objectives: ['Learn how the users work today', 'Learn what they miss'],
      topics: ['daily use', 'problems'],
      information_gaps: ['How many users are there?'],
      stakeholder_types: ['user', 'administrator'],
      strategies: ['Open questions first'],
      stopping_conditions: ['Every topic was asked about'],
    },
    items: [],
  }
  const catalog: ArtifactSpec = {
    kind: 'persona_catalog',
    title: 'Persona catalog',
    summary: 'One persona for each stakeholder type.',
    status: 'approved',
    content: {
      selection_rationale: 'One persona for each stakeholder type.',
      uncovered_stakeholder_types: [],
    },
    items: personas.map((name, index) => ({
      key: `PER-00${String(index + 1)}`,
      kind: 'persona',
      status: 'approved',
      content: {
        name,
        stakeholder_type: index === 0 ? 'user' : 'administrator',
        background: `${name} of the product.`,
        expertise: 'Knows the daily work.',
        goals: [requirements[index] ?? requirements[0]],
        interests: [],
        constraints: [],
        priorities: [],
        concerns: [],
        behavioral_tendencies: 'Prefers a short path to the result.',
        interview_status: 'completed',
      },
    })),
  }
  const specification: ArtifactSpec = {
    kind: 'requirement_specification',
    title: 'Requirement specification',
    summary: `${String(requirements.length)} functional requirements.`,
    content: {
      purpose: 'What the product shall do.',
      scope: 'The daily use of the product.',
      out_of_scope: [],
      definitions: [],
    },
    items: [
      section(
        'SEC-001',
        'Functional requirements',
        requirements.map((title, index) => ({
          key: `REQ-00${String(index + 1)}`,
          kind: 'spec_requirement',
          content: {
            title,
            statement: `The system shall let the user: ${title.toLowerCase()}.`,
            type: 'functional',
            quality_category: null,
            priority: index === 2 ? 'should' : 'must',
            rationale: 'Named in the interviews.',
            acceptance_criteria: [`${title} works from the first page`],
            fit_criterion: null,
            verification_method: 'test',
          },
        })),
      ),
    ],
  }
  return [plan, catalog, specification]
}

function simple(project: SimpleProject): BuiltProject {
  return buildProjectArtifacts(simpleSpecs(project), project)
}

const projects: BuiltProject[] = [
  buildProjectArtifacts(mentorArtifactSpecs, {
    n: 1,
    projectId: projectIds.mentor,
    runId: runIds.mentorMain3,
    day: '2026-10-06',
    editedKeys: mentorEditedKeys,
  }),
  simple({
    n: 2,
    projectId: projectIds.campus,
    runId: runIds.campusMain1,
    day: '2026-10-05',
    personas: ['Hungry student', 'Canteen cook'],
    requirements: ['Order from a menu', 'Pick up with a code', 'See the queue'],
  }),
  simple({
    n: 3,
    projectId: projectIds.library,
    runId: runIds.libraryMain1,
    day: '2026-10-03',
    personas: ['Student', 'Librarian'],
    requirements: ['Book a study room', 'Book a seat', 'Release an unused booking'],
  }),
  simple({
    n: 4,
    projectId: projectIds.laundry,
    runId: runIds.laundryMain1,
    day: '2026-09-20',
    personas: ['Resident', 'Dorm manager'],
    requirements: ['Book a machine', 'Release an unused booking', 'See the free machines'],
  }),
  ...generatedProjectSpecs
    .filter(({ lastRun }) => lastRun !== 'none')
    .map((spec) =>
      simple({
        n: spec.n,
        projectId: mockId(IdPrefix.Project, spec.n),
        runId: mockId(IdPrefix.Run, spec.n * 10 + 1),
        day: spec.day,
        personas: ['Regular user', 'Administrator'],
        requirements: spec.requirements,
      }),
    ),
]

export const artifactFixtures: Artifact[] = projects.flatMap(({ artifacts }) => artifacts)
export const itemFixtures: ArtifactItem[] = projects.flatMap(({ items }) => items)

/** The item of a project with this key; for tests that need an id of the mock data. */
export function itemFixtureByKey(projectId: string, key: string): ArtifactItem {
  return assertPresent(
    itemFixtures.find((item) => item.project_id === projectId && item.key === key),
    `No mock item ${key}`,
  )
}

/** The artifact of a project of this kind; for tests that need an id of the mock data. */
export function artifactFixtureByKind(projectId: string, kind: string, title?: string): Artifact {
  return assertPresent(
    artifactFixtures.find(
      (artifact) =>
        artifact.project_id === projectId &&
        artifact.kind === kind &&
        (title === undefined || artifact.title === title),
    ),
    `No mock artifact of kind ${kind}`,
  )
}
