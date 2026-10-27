import type { WorkflowDefinition } from '@/modules/workflow/entities'

import definition from './requirements_engineering.v1.json'

// The JSON is a copy of the definition file of the docs; the test of the workflow API reads it
// through the schema of the definition, which checks that the cast holds.

/** The workflow definition at version 1, the only version of the mock data. */
export const workflowDefinitionFixture = definition as WorkflowDefinition
