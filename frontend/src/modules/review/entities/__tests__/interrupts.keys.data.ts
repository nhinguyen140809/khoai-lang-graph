import { interruptKeys } from '../interrupts.keys'

/** A key, and the wider key it starts with. */
export const keyCases = [
  { name: 'the interrupts of a run', key: interruptKeys.ofRun('r1'), wider: interruptKeys.all() },
  {
    name: 'every interrupt of a run',
    key: interruptKeys.list('r1'),
    wider: interruptKeys.ofRun('r1'),
  },
  {
    name: 'the interrupt that a run waits for',
    key: interruptKeys.pending('r1'),
    wider: interruptKeys.ofRun('r1'),
  },
]

/** Two keys that must differ, so that one query never answers for the other. */
export const distinctCases = [
  {
    name: 'the interrupts of two runs',
    first: interruptKeys.list('r1'),
    second: interruptKeys.list('r2'),
  },
  {
    name: 'the list and the pending interrupt of one run',
    first: interruptKeys.list('r1'),
    second: interruptKeys.pending('r1'),
  },
]
