/** The time of the cases. */
export const now = new Date('2026-10-10T12:00:00Z')

/** A past time, and how it reads at `now`. */
export const relativeTimeCases = [
  ['2026-10-10T11:59:40Z', 'just now'],
  ['2026-10-10T11:59:00Z', '1 min ago'],
  ['2026-10-10T11:58:00Z', '2 min ago'],
  ['2026-10-10T11:00:01Z', '59 min ago'],
  ['2026-10-10T07:00:00Z', '5 h ago'],
  ['2026-10-09T09:00:00Z', 'yesterday'],
  ['2026-10-07T09:00:00Z', '3 days ago'],
  ['2026-10-04T09:00:00Z', '6 days ago'],
  ['2026-10-01T09:00:00Z', 'Oct 1'],
  ['2025-12-24T09:00:00Z', 'Dec 24, 2025'],
]
