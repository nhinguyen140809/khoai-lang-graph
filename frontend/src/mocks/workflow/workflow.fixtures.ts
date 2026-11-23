import type { WorkflowDefinition } from '@/modules/workflow/entities'
import { assertPresent } from '@/shared/lib/guards'

import assistance from './assistance.v1.json' with { type: 'json' }
import definition from './requirements_engineering.v2.json' with { type: 'json' }

// The JSON is a copy of the definition file of the docs; the test of the workflow API reads it
// through the schema of the definition, which checks that the cast holds.

/** The workflow definition at version 2, the only version of the mock data. */
export const workflowDefinitionFixture = definition as WorkflowDefinition

/** The requirements workflow at the version of the mock data, as a run names it. */
export const workflowRefFixture = {
  name: workflowDefinitionFixture.name,
  version: workflowDefinitionFixture.version,
}

/** The definition of the assistance workflow, which answers a message about the app. */
export const assistanceDefinitionFixture = assistance as unknown as WorkflowDefinition

/** The assistance workflow at its version, as a run names it. */
export const assistanceRefFixture = {
  name: assistanceDefinitionFixture.name,
  version: assistanceDefinitionFixture.version,
}

/** The agent of the assistance workflow: its node, its stage and its role, as its definition names them. */
export const assistanceAgentFixture = assertPresent(
  assistanceDefinitionFixture.nodes.find((node) => node.kind === 'agent'),
  'The definition of the assistance workflow has an agent.',
)

/** A tool of the assistance workflow by its key, as its definition declares it. */
export function assistanceToolFixture(key: string) {
  return assertPresent(
    assistanceDefinitionFixture.tools.find((tool) => tool.key === key),
    `The definition of the assistance workflow declares the tool ${key}.`,
  )
}

/**
 * The definition with one more run parameter of each kind that the one of the docs has none of: a
 * flag with a default, a flag without one, and a choice among values. The `mock-run-parameters`
 * scenario `all-types` serves it, to see every control of the run settings.
 */
export const workflowDefinitionWithEveryParameterType: WorkflowDefinition = {
  ...workflowDefinitionFixture,
  run_parameters_schema: {
    ...workflowDefinitionFixture.run_parameters_schema,
    properties: {
      ...workflowDefinitionFixture.run_parameters_schema.properties,
      strict_review: {
        type: 'boolean',
        title: 'Strict review',
        description: 'Stop at any doubt that the review finds.',
        default: false,
      },
      keep_transcripts: {
        type: 'boolean',
        title: 'Keep the transcripts',
        description: 'Keep the full text of every interview.',
      },
      interview_style: {
        type: 'string',
        title: 'Interview style',
        description: 'How the interviewers lead the talk.',
        enum: ['structured', 'open', 'mixed'],
        default: 'mixed',
      },
    },
  },
}
