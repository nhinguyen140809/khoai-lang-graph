import { artifactKindKeys } from '../artifact-kinds.keys'

/** A key, and the wider key it starts with. */
export const keyCases = [
  { name: 'the list of kinds', key: artifactKindKeys.list(), wider: artifactKindKeys.all() },
  {
    name: 'the list of kinds of a workflow version',
    key: artifactKindKeys.list(1),
    wider: artifactKindKeys.all(),
  },
  {
    name: 'the schema of a kind at a version',
    key: artifactKindKeys.schema('persona', 1),
    wider: artifactKindKeys.all(),
  },
]

/** Two keys that must differ, so that one query never answers for the other. */
export const distinctCases = [
  {
    name: 'the list of kinds now and at a workflow version',
    first: artifactKindKeys.list(),
    second: artifactKindKeys.list(1),
  },
]
