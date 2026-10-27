// The kinds of file, <subject>.<kind>.ts, that each place of src/ holds. Components (.tsx), hooks
// (hooks/useSomething.ts) and unit tests have rules of their own; a kind with two files or more
// gets a folder named after it in the plural.
/** @type {Record<'entities' | 'features' | 'widgets' | 'shared' | 'mocks' | 'test', string[]>} */
export const fileKinds = {
  entities: ['api', 'keys', 'queries', 'types', 'reducer', 'constants', 'utils'],
  features: ['types', 'schema', 'store', 'reducer', 'constants', 'utils'],
  widgets: ['types', 'store', 'reducer', 'constants', 'utils', 'fixtures'],
  shared: ['types', 'store', 'reducer', 'config', 'constants', 'utils'],
  mocks: [
    'types',
    'store',
    'constants',
    'utils',
    'handlers',
    'fixtures',
    'lookup',
    'changes',
    'problems',
    'validators',
    'setup',
  ],
  test: ['utils', 'types', 'setup'],
}
export const allFileKinds = [...new Set(Object.values(fileKinds).flat())]

// The folder of a kind, in the plural when the kind has two files or more.
/** @type {Record<string, string>} */
export const kindFolders = {
  api: 'api',
  keys: 'keys',
  queries: 'queries',
  types: 'types',
  schema: 'schemas',
  store: 'stores',
  reducer: 'reducers',
  constants: 'constants',
  utils: 'utils',
  fixtures: 'fixtures',
}

// The places of src/ and tests/ that hold only some of the kinds, with the files that each place
// covers as a check-file glob. A place listed later is more specific.
export const kindPlaces = [
  { files: 'src/**/!(hooks|__tests__)/*.ts', kinds: allFileKinds },
  { files: 'src/modules/*/entities/**/!(hooks|__tests__|@x)/*.ts', kinds: fileKinds.entities },
  { files: 'src/modules/*/entities/*.ts', kinds: fileKinds.entities },
  { files: 'src/modules/*/features/**/!(hooks|__tests__)/*.ts', kinds: fileKinds.features },
  { files: 'src/modules/*/widgets/**/!(hooks|__tests__)/*.ts', kinds: fileKinds.widgets },
  { files: 'src/shared/**/!(hooks|__tests__)/*.ts', kinds: fileKinds.shared },
  { files: 'src/mocks/**/!(hooks|__tests__)/*.ts', kinds: fileKinds.mocks },
  { files: 'src/test/**/!(hooks|__tests__)/*.ts', kinds: fileKinds.test },
]

// The patterns of check-file for the parts of a file name.
export const kebabCasePattern = '+([a-z0-9])*(-+([a-z0-9]))'
export const pascalCasePattern = '+([A-Z])*([a-zA-Z0-9])'
