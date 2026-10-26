/** The query of an address, a filter and the value of a record, and whether the record passes. */
export const paramMatchCases = [
  { name: 'no such filter', query: 'kind=a', param: 'status', value: 'x', passes: true },
  { name: 'the same value', query: 'kind=a', param: 'kind', value: 'a', passes: true },
  { name: 'another value', query: 'kind=a', param: 'kind', value: 'b', passes: false },
  { name: 'a record without a value', query: 'kind=a', param: 'kind', value: null, passes: false },
]

/** The address of a read, and the version that its query names. */
export const requestedVersionCases = [
  { name: 'a version', address: 'http://x.test/items/i1?version=2', version: 2 },
  { name: 'no query', address: 'http://x.test/items/i1', version: null },
  { name: 'an empty version', address: 'http://x.test/items/i1?version=', version: null },
  { name: 'version zero', address: 'http://x.test/items/i1?version=0', version: null },
  { name: 'a negative version', address: 'http://x.test/items/i1?version=-1', version: null },
  { name: 'a version with decimals', address: 'http://x.test/items/i1?version=1.5', version: null },
  {
    name: 'a version that is not a number',
    address: 'http://x.test/items/i1?version=last',
    version: null,
  },
]
