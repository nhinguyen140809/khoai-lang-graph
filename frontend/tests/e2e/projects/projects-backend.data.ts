/** A list of the API, the path that it is read at, and the page size that splits it. */
export const pagedLists: { name: string; path: string; limit: number }[] = [
  { name: 'projects', path: '/projects', limit: 1 },
  { name: 'threads of the user', path: '/threads', limit: 1 },
  { name: 'steps of a run', path: '/runs/:run/steps', limit: 5 },
  { name: 'messages of a thread', path: '/threads/:thread/messages', limit: 1 },
]

/** What the client sends as a cursor and the API refuses. */
export const badCursors = ['2', 'not-a-cursor', '!!!']
