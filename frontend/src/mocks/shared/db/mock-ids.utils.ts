/** An id of the mock data: the prefix of its kind and a number. */
export function mockId(prefix: string, n: number): string {
  return `${prefix}0000-0000-4000-8000-${String(n).padStart(12, '0')}`
}

/** Ids of records created while the mock server runs, apart from the ids of the fixtures. */
export function createdId(prefix: string, n: number): string {
  return mockId(prefix, 9000 + n)
}
