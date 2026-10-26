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

/** A date, and how it reads with its year. */
export const dateCases = [
  ['2026-10-01T09:00:00', 'Oct 1, 2026'],
  ['2025-12-24T23:59:00', 'Dec 24, 2025'],
  ['2026-01-05T00:00:00', 'Jan 5, 2026'],
] as const

/** A date, and how it reads with the time of day. */
export const dateTimeCases = [
  ['2026-10-01T14:05:00', 'Oct 1, 2026, 14:05'],
  ['2026-10-01T00:00:00', 'Oct 1, 2026, 00:00'],
  ['2026-12-24T23:59:00', 'Dec 24, 2026, 23:59'],
] as const

/** A length in milliseconds, and how it reads. */
export const durationCases = [
  { name: 'zero', ms: 0, text: '0 ms' },
  { name: 'less than a second', ms: 850, text: '850 ms' },
  { name: 'a negative length', ms: -500, text: '0 ms' },
  { name: 'just under a second, which rounds up', ms: 999.6, text: '1.0 s' },
  { name: 'one second', ms: 1000, text: '1.0 s' },
  { name: 'a few seconds', ms: 4234, text: '4.2 s' },
  { name: 'just under ten seconds, which rounds up', ms: 9960, text: '10 s' },
  { name: 'ten seconds', ms: 10_000, text: '10 s' },
  { name: 'about a minute less', ms: 59_400, text: '59 s' },
  { name: 'just under a minute, which rounds up', ms: 59_600, text: '1 min' },
  { name: 'whole minutes', ms: 120_000, text: '2 min' },
  { name: 'minutes and seconds', ms: 125_000, text: '2 min 5 s' },
  { name: 'just under an hour, which rounds up', ms: 3_599_600, text: '1 h' },
  { name: 'whole hours', ms: 7_200_000, text: '2 h' },
  { name: 'hours and minutes', ms: 3_840_000, text: '1 h 4 min' },
] as const
