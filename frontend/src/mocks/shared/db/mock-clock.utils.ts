/** A time in the form of the times of the fixtures: ISO 8601 in UTC, without milliseconds. */
export function isoTime(date: Date): string {
  return date.toISOString().replace(/\.\d+Z$/, 'Z')
}

/** The time of a record that the mock server makes now. */
export function mockNow(): string {
  return isoTime(new Date())
}
