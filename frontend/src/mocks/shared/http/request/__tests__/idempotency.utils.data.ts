/** A request to the handler under test: its key, if any, and its body. */
export interface KeyedRequest {
  key: string | null
  body: object
}

/** Requests that the handler does not take for a repeat, and the work that each one does. */
export const separateRequestCases: { name: string; requests: KeyedRequest[]; works: number }[] = [
  {
    name: 'requests without a key',
    requests: [
      { key: null, body: { a: 1 } },
      { key: null, body: { a: 1 } },
    ],
    works: 2,
  },
  {
    name: 'requests with other keys',
    requests: [
      { key: 'k1', body: { a: 1 } },
      { key: 'k2', body: { a: 1 } },
    ],
    works: 2,
  },
]
