/** The filters of the project list, and the query of the request that lists the projects. */
export const listQueryCases = [
  {
    name: 'no filter',
    filters: { runStatuses: [], activeWithinDays: null },
    query: 'status=active',
  },
  {
    name: 'two statuses, each in a parameter',
    filters: { runStatuses: ['interrupted', 'none'], activeWithinDays: null },
    query: 'status=active&rollup_run_status=interrupted&rollup_run_status=none',
  },
  {
    name: 'a period, from its days before now',
    filters: { runStatuses: [], activeWithinDays: 2 },
    query: 'status=active&last_activity_after=2026-10-15T12%3A00%3A00.000Z',
  },
] as const

/** The moment that the periods of the last activity end at. */
export const queryNow = new Date('2026-10-17T12:00:00Z')
