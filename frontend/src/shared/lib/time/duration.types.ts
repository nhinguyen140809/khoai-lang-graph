/** The kinds of a duration rounded to whole minutes, as `roundedDuration` gives it. */
export const roundedDurationKinds = ['lessThanAMinute', 'minutes', 'hours'] as const

export type RoundedDurationKind = (typeof roundedDurationKinds)[number]

/** A duration rounded to whole minutes: under a minute, the minutes, or the hours and the minutes. */
export type RoundedDuration =
  | { kind: 'lessThanAMinute' }
  | { kind: 'minutes'; minutes: number }
  | { kind: 'hours'; hours: number; minutes: number }
