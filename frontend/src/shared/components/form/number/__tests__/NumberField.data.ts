/** What the user types in a count of 0 to 20 that must be whole, and the message of the field. */
export const refusedCounts = [
  { name: 'nothing', typed: '', message: 'Enter a number.' },
  { name: 'a number past the maximum', typed: '25', message: 'Use at most 20.' },
] as const

/** What the user types, and the number that the form gets. */
export const acceptedCounts = [
  { typed: '7', value: 7 },
  { typed: '0', value: 0 },
  { typed: '20', value: 20 },
] as const
