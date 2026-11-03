import type { Artifact } from '../artifacts.types'

/** An artifact reduced to the fields that the helper reads. */
const artifact = (kind: string, content: Record<string, unknown>) => ({ kind, content }) as Artifact

const artifacts = [
  artifact('elicitation_plan', {
    topics: ['search', 'booking'],
    gaps: 'none',
    mixed: ['a', 1, null],
  }),
]

/** The artifacts of a project, the source a field names, and the values it may take. */
export const allowedValuesCases = [
  {
    name: 'the entries of a list',
    artifacts,
    allowedValuesFrom: 'elicitation_plan.topics',
    values: ['search', 'booking'],
  },
  {
    name: 'the texts of a list that holds other values too',
    artifacts,
    allowedValuesFrom: 'elicitation_plan.mixed',
    values: ['a'],
  },
  {
    name: 'a field that is not a list',
    artifacts,
    allowedValuesFrom: 'elicitation_plan.gaps',
    values: [],
  },
  {
    name: 'a field that does not exist',
    artifacts,
    allowedValuesFrom: 'elicitation_plan.nothing',
    values: [],
  },
  {
    name: 'an artifact not made yet',
    artifacts,
    allowedValuesFrom: 'persona_catalog.types',
    values: [],
  },
  {
    name: 'a source without a field',
    artifacts,
    allowedValuesFrom: 'elicitation_plan',
    values: [],
  },
  { name: 'a field without a source', artifacts, allowedValuesFrom: null, values: [] },
  {
    name: 'artifacts that have not loaded',
    artifacts: undefined,
    allowedValuesFrom: 'elicitation_plan.topics',
    values: [],
  },
]
