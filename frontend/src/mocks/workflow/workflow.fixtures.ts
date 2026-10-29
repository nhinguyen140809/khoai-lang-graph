import type { WorkflowDefinition } from '@/modules/workflow/entities'

import definition from './requirements_engineering.v1.json'

// The JSON is a copy of the definition file of the docs; the test of the workflow API reads it
// through the schema of the definition, which checks that the cast holds.

/** The workflow definition at version 1, the only version of the mock data. */
export const workflowDefinitionFixture = definition as WorkflowDefinition

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
