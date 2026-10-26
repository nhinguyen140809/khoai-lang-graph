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
