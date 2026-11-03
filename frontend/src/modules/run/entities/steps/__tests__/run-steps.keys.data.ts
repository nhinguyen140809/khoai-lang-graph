import { runModuleKeys } from '../../runs/run-module.keys'
import { runStepKeys } from '../run-steps.keys'

/** A key, and the wider key it starts with. */
export const keyCases = [
  { name: 'every key of this kind', key: runStepKeys.all(), wider: runModuleKeys.all() },
  { name: 'the steps of a run', key: runStepKeys.ofRun('r1'), wider: runStepKeys.all() },
]

/** Two keys that must differ, so that one query never answers for the other. */
export const distinctCases = [
  {
    name: 'the steps of two runs',
    first: runStepKeys.ofRun('r1'),
    second: runStepKeys.ofRun('r2'),
  },
]
