import { workflowKeys } from '../workflow.keys'

/** A key, and the wider key it starts with. */
export const keyCases = [
  {
    name: 'the current definition',
    key: workflowKeys.definition(),
    wider: workflowKeys.all(),
  },
  {
    name: 'the definition at a version',
    key: workflowKeys.definition(1),
    wider: workflowKeys.all(),
  },
]

/** Two keys that must differ, so that one query never answers for the other. */
export const distinctCases = [
  {
    name: 'the current definition and a version',
    first: workflowKeys.definition(),
    second: workflowKeys.definition(1),
  },
]
