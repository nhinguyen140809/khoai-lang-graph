import { runModuleKeys } from '../../runs/run-module.keys'
import { runStateKeys } from '../run-state.keys'

/** A key, and the wider key it starts with. */
export const keyCases = [
  { name: 'every key of this kind', key: runStateKeys.all(), wider: runModuleKeys.all() },
  { name: 'every state of a run', key: runStateKeys.ofRun('r1'), wider: runStateKeys.all() },
  {
    name: 'the current state of a run',
    key: runStateKeys.current('r1'),
    wider: runStateKeys.ofRun('r1'),
  },
  {
    name: 'the state after a step',
    key: runStateKeys.afterStep('r1', 's1'),
    wider: runStateKeys.ofRun('r1'),
  },
]

/** Two keys that must differ, so that one query never answers for the other. */
export const distinctCases = [
  {
    name: 'the current state and the state after a step',
    first: runStateKeys.current('r1'),
    second: runStateKeys.afterStep('r1', 's1'),
  },
  {
    name: 'the state after two steps',
    first: runStateKeys.afterStep('r1', 's1'),
    second: runStateKeys.afterStep('r1', 's2'),
  },
  {
    name: 'the current state of two runs',
    first: runStateKeys.current('r1'),
    second: runStateKeys.current('r2'),
  },
]
