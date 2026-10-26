/** The messages that several patterns share. */
export const messages = {
  layerOrder: 'A layer imports only the layers under it (CONTRIBUTING: Modules).',
  publicApi:
    'Import a slice from its index (@/modules/<module>/entities, @/modules/<module>/features/<feature>, @/modules/<module>/widgets/<widget>). Inside the same slice, use a relative import.',
  moduleOrder: 'A module imports only the modules under it (the lists of moduleImports).',
  sharedCodeIsBelow:
    'Shared code imports no module or app code. Pass their components in as props from src/app/.',
  componentCallsApi: 'A component calls the API through a hook, which calls <subject>.api.ts.',
}
