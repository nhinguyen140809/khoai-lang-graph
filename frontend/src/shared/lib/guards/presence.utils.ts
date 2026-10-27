// Three ways to ask whether a value is missing, from the loosest to the strictest: `isBlank` (absent
// or only whitespace), `isEmpty` (blank, or an empty list) and `hasText` (a string with a word in it,
// so a number is not text). `assertPresent` is for a value that must exist.

/** Whether a value is absent or a string containing only whitespace. */
export function isBlank(value: unknown): boolean {
  return value == null || (typeof value === 'string' && value.trim() === '')
}

/** Whether a value is blank or an empty list. */
export function isEmpty(value: unknown): boolean {
  return isBlank(value) || (Array.isArray(value) && value.length === 0)
}

/** Whether a value is a string that holds more than whitespace. */
export function hasText(value: unknown): boolean {
  return typeof value === 'string' && value.trim() !== ''
}

/** The value, which must be neither `undefined` nor `null`; throws an error with `message` if it is. */
export function assertPresent<T>(value: T | null | undefined, message: string): T {
  if (value === undefined || value === null) throw new Error(message)
  return value
}
