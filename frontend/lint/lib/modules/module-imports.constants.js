// The modules of src/modules/ and the modules that each one may import. A module imports only the
// modules under it, so that the modules depend one way; a module that does not exist yet has its
// place already.
/** @type {Record<string, string[]>} */
export const moduleImports = {
  workflow: [],
  artifact: ['workflow'],
  trace: ['workflow', 'artifact'],
  run: ['workflow', 'artifact'],
  review: ['workflow', 'artifact', 'run'],
  thread: ['workflow', 'artifact', 'run', 'review'],
  project: ['workflow', 'artifact', 'run', 'review', 'thread'],
  activity: ['workflow', 'artifact', 'run', 'review', 'thread'],
  documents: ['workflow', 'artifact', 'trace', 'run', 'review', 'thread', 'project'],
  traceability: [
    'workflow',
    'artifact',
    'trace',
    'run',
    'review',
    'thread',
    'project',
    'documents',
  ],
  auth: [],
  user: ['auth', 'run'],
  usage: [],
  'llm-model': [],
  'design-system': [],
}

// The layers of a module, from the lowest: one slice of entities, then one slice for each feature
// and for each widget.
export const moduleLayers = ['entities', 'features', 'widgets']
