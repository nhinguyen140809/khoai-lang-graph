/** A time in the form of the times of the fixtures: ISO 8601 in UTC, without milliseconds. */
export function isoTime(date: Date): string {
  return date.toISOString().replace(/\.\d+Z$/, 'Z')
}

/** How many milliseconds have passed since a time written as the fixtures write it. */
export function msSince(time: string): number {
  return Date.now() - Date.parse(time)
}

/** The time of a record that the mock server makes now. */
export function mockNow(): string {
  return isoTime(new Date())
}
