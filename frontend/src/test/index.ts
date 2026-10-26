// The helpers of the unit tests, in a folder for each topic: `msw` calls the mock server and
// records what it receives, `suites` has the `it*` functions that register tests which several
// files share (the request that a function of the API sends, the dialog that an action asks with,
// the fields that a form refuses, the states of a query, the toast of a result, the requests that
// the mock server refuses), `next-stubs` stands in for the router and the links of Next.js,
// `render` has what a test renders with, and `steps` has what a test does after it has rendered:
// waiting for a query, answering a dialog, typing in a form, reading a toast and checking
// accessibility. Import from the folder when a test needs one topic, and from here when it needs
// several. `vitest.setup.ts` is the setup file of Vitest and is not exported.
export * from './msw'
export * from './next-stubs'
export * from './render'
export * from './steps'
export * from './suites'
