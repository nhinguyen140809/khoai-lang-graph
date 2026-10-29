import { runModuleKeys } from '../../runs/run-module.keys'
import { directiveKeys } from '../directives.keys'

/** A key, and the wider key it starts with. */
export const keyCases = [
  { name: 'every key of this kind', key: directiveKeys.all(), wider: runModuleKeys.all() },
  { name: 'the directives of a run', key: directiveKeys.ofRun('r1'), wider: directiveKeys.all() },
]

/** Two keys that must differ, so that one query never answers for the other. */
export const distinctCases = [
  {
    name: 'the directives of two runs',
    first: directiveKeys.ofRun('r1'),
    second: directiveKeys.ofRun('r2'),
  },
]
