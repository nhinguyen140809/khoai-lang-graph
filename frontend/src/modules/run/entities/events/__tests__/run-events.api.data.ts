import { runIds } from '@/mocks/shared/db'

/** A run, the last event read, and the address of the stream. */
export const eventsUrlCases = [
  { name: 'from the first event', runId: runIds.mentorMain3, after: null, query: '' },
  {
    name: 'after the last event read',
    runId: runIds.mentorMain3,
    after: '246',
    query: '?after=246',
  },
  { name: 'with an id that needs encoding', runId: 'run 1', after: null, query: '' },
]
