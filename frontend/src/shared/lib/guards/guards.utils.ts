/** Whether a value is an object with keys: not null and not a list. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Whether a value is one of the values of a list, such as the values of a `const` list. */
export function isOneOf<T>(values: readonly T[], value: unknown): value is T {
  return values.some((entry) => entry === value)
}

/** Whether a value is a string, whatever it holds. */
export function isString(value: unknown): value is string {
  return typeof value === 'string'
}
