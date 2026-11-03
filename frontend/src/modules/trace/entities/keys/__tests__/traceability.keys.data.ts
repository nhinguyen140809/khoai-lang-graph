import { traceModuleKeys } from '../trace-module.keys'
import { traceabilityKeys } from '../traceability.keys'

/** A key, and the wider key it starts with. */
export const keyCases = [
  { name: 'every key of this kind', key: traceabilityKeys.all(), wider: traceModuleKeys.all() },
  { name: 'the matrix', key: traceabilityKeys.matrix('p1'), wider: traceabilityKeys.all() },
  { name: 'the coverage', key: traceabilityKeys.coverage('p1'), wider: traceabilityKeys.all() },
]

/** Two keys that must differ, so that one query never answers for the other. */
export const distinctCases = [
  {
    name: 'the matrix and the coverage',
    first: traceabilityKeys.matrix('p1'),
    second: traceabilityKeys.coverage('p1'),
  },
  {
    name: 'the matrix of two projects',
    first: traceabilityKeys.matrix('p1'),
    second: traceabilityKeys.matrix('p2'),
  },
]
