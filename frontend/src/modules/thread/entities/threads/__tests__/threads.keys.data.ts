import { threadKeys } from '../threads.keys'

/** A key of the threads, and the wider key it starts with. */
export const keyCases = [
  { name: 'every list of threads', key: threadKeys.lists(), wider: threadKeys.all() },
  {
    name: 'the threads of a project',
    key: threadKeys.ofProject('p1'),
    wider: threadKeys.lists(),
  },
  {
    name: 'the threads of the user',
    key: threadKeys.list({}),
    wider: threadKeys.lists(),
  },
  {
    name: 'the threads of the user narrowed to a project',
    key: threadKeys.list({ projectId: 'p1' }),
    wider: threadKeys.lists(),
  },
  { name: 'one thread', key: threadKeys.detail('t1'), wider: threadKeys.all() },
]

/** Two keys of the threads that must differ, so that one query never answers for the other. */
export const distinctCases = [
  {
    name: 'the threads of two projects',
    first: threadKeys.ofProject('p1'),
    second: threadKeys.ofProject('p2'),
  },
  {
    name: 'the threads of the user narrowed to two projects',
    first: threadKeys.list({ projectId: 'p1' }),
    second: threadKeys.list({ projectId: 'p2' }),
  },
  {
    name: 'the threads of a project and the threads of the user',
    first: threadKeys.ofProject('p1'),
    second: threadKeys.list({}),
  },
  {
    name: 'one thread and the threads of its project',
    first: threadKeys.detail('t1'),
    second: threadKeys.ofProject('p1'),
  },
]
