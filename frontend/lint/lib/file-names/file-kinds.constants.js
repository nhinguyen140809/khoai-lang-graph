// The kinds of file, <subject>.<kind>.ts, that each place of src/ holds. Components (.tsx), hooks
// (hooks/useSomething.ts) and unit tests have rules of their own; a kind with two files or more
// gets a folder named after it in the plural.
/** @type {Record<'entities' | 'features' | 'widgets' | 'shared' | 'mocks' | 'test', string[]>} */
export const fileKinds = {
  entities: ['api', 'keys', 'queries', 'types', 'schema', 'reducer', 'constants', 'utils'],
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
// covers as a check-file glob. A place listed later is more specific: a file follows every place
// that covers it. A place with `hooks` also takes a lone hook, use<Name>.ts: the root of a feature
// or a widget, where a slice with one hook keeps it.
export const kindPlaces = [
  { files: 'src/**/!(hooks|__tests__)/*.ts', kinds: allFileKinds, hooks: true },
  { files: 'src/modules/*/entities/**/!(hooks|__tests__|@x)/*.ts', kinds: fileKinds.entities },
  { files: 'src/modules/*/entities/*.ts', kinds: fileKinds.entities },
  { files: 'src/modules/*/features/*/*.ts', kinds: fileKinds.features, hooks: true },
  { files: 'src/modules/*/features/*/**/!(hooks|__tests__)/*.ts', kinds: fileKinds.features },
  { files: 'src/modules/*/widgets/*/*.ts', kinds: fileKinds.widgets, hooks: true },
  { files: 'src/modules/*/widgets/*/**/!(hooks|__tests__)/*.ts', kinds: fileKinds.widgets },
  { files: 'src/shared/**/!(hooks|__tests__)/*.ts', kinds: fileKinds.shared },
  { files: 'src/mocks/**/!(hooks|__tests__)/*.ts', kinds: fileKinds.mocks },
  { files: 'src/test/**/!(hooks|__tests__)/*.ts', kinds: fileKinds.test },
]

// The patterns of check-file for the parts of a file name.
export const kebabCasePattern = '+([a-z0-9])*(-+([a-z0-9]))'
export const pascalCasePattern = '+([A-Z])*([a-zA-Z0-9])'

// The modules whose entities split by topic, with their topics: the root of the entities holds a
// folder for each topic, and a topic holds its files by kind, flat, with its components, hooks
// and tests. The other modules keep a folder for each kind at the root of the entities. Each
// topic lists the topics that it reads, so that the topics depend one way; a topic never reads
// the components at the root of the entities, which serve several topics, while a component that
// serves one topic sits in the components folder of that topic, and one that serves the topics
// of a group sits in the components folder of that group. A topic named <group>/<name> sits in a
// folder of its group, which holds its topic folders, the components of the group and no file;
// the topics of a group read each other by the same one-way lists. A new topic is added here.
/** @type {Record<string, Record<string, string[]>>} */
export const topicEntityModules = {
  artifact: {
    artifacts: [],
    exports: ['artifacts'],
    items: ['artifacts'],
    issues: ['items'],
    revisions: ['artifacts', 'items'],
    status: ['artifacts', 'items'],
    outline: ['artifacts', 'items', 'status'],
  },
  'llm-model': {
    'model-settings': [],
    models: [],
  },
  project: {
    projects: [],
    'run-status': [],
  },
  run: {
    config: [],
    directives: ['config', 'runs', 'status'],
    events: ['runs', 'status'],
    runs: ['config', 'status'],
    state: ['config', 'runs', 'status'],
    status: [],
    steps: ['config', 'runs', 'status'],
  },
  thread: {
    messages: [],
    threads: ['messages'],
  },
  trace: {
    chains: ['links'],
    'item-links': ['chains'],
    links: [],
    traceability: [],
  },
  user: {
    sessions: [],
    user: [],
    'user-settings': [],
  },
  workflow: {
    'artifact-kinds': ['definition'],
    checkpoints: ['definition'],
    'content/fields': ['artifact-kinds'],
    'content/values': ['artifact-kinds', 'content/fields', 'definition'],
    'content/value-labels': ['content/fields', 'content/values', 'definition'],
    definition: [],
    issues: ['content/values', 'definition'],
    'run-parameters': ['definition'],
    stages: ['definition'],
  },
}
