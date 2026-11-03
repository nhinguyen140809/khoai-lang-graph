import { messageKeys } from '../messages.keys'

/** A key of the messages, and the wider key it starts with. */
export const keyCases = [
  {
    name: 'the messages of a thread',
    key: messageKeys.ofThread('t1'),
    wider: messageKeys.all(),
  },
]

/** Two keys of the messages that must differ, so that one query never answers for the other. */
export const distinctCases = [
  {
    name: 'the messages of two threads',
    first: messageKeys.ofThread('t1'),
    second: messageKeys.ofThread('t2'),
  },
]
