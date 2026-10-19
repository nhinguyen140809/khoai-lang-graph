import { threadKeys } from '../threads.keys'

/** A key of the threads, and the key above it. */
export const keyCases = [
  { name: 'the threads of a project', key: threadKeys.ofProject('p1'), wider: threadKeys.all() },
]
