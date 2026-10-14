// Fixed ids of the mock data, shared by the fixture files. Each id starts like the id of the same
// record in the API examples, so that the examples and the mock data are easy to match.

/** An id of the mock data: the prefix of its kind and a number. */
export function mockId(prefix: string, n: number): string {
  return `${prefix}0000-0000-4000-8000-${String(n).padStart(12, '0')}`
}

export const USER_ID = mockId('11b7', 1)
