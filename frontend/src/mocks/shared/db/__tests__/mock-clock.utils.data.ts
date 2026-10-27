/** A date, and the time as the fixtures write it: UTC, without milliseconds. */
export const isoTimeCases = [
  {
    name: 'a time with milliseconds',
    date: '2026-10-10T09:15:30.456Z',
    time: '2026-10-10T09:15:30Z',
  },
  {
    name: 'a time of whole seconds',
    date: '2026-10-10T09:15:30.000Z',
    time: '2026-10-10T09:15:30Z',
  },
  { name: 'the start of a day', date: '2026-10-10T00:00:00.001Z', time: '2026-10-10T00:00:00Z' },
  {
    name: 'a time given with an offset',
    date: '2026-10-10T16:15:30.9+07:00',
    time: '2026-10-10T09:15:30Z',
  },
]

/** A time, and the milliseconds from it to 2026-10-10T09:15:30Z, the time of the clock in the test. */
export const msSinceCases = [
  { name: 'the same second', time: '2026-10-10T09:15:30Z', ms: 0 },
  { name: 'a second ago', time: '2026-10-10T09:15:29Z', ms: 1000 },
  { name: 'a day ago', time: '2026-10-09T09:15:30Z', ms: 86_400_000 },
  { name: 'a time to come', time: '2026-10-10T09:15:31Z', ms: -1000 },
]
