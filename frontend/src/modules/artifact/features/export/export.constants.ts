/** The words of exporting the documents of a project. */
export const exportMessages = {
  button: 'Export',
  dialogTitle: 'Export',
  template: 'Documents',
  templateHint:
    'Choose one or more. Each one comes as its own file, in the file type that you pick for it.',
  all: 'All documents',
  allHint: 'In one file',
  selectAll: 'Select all',
  clearAll: 'Clear',
  chooseOne: 'Choose at least one document.',
  fileTypeOf: (title: string) => `File type of ${title}`,
  contents: (titles: readonly string[]) => titles.join(', '),
  cancel: 'Cancel',
  submit: 'Export',
  submitting: 'Exporting',
  /** The file of an export whose template the definition no longer has. */
  unknownFile: 'The document',
  preparing: (file: string) => `Preparing ${file}`,
  ready: (file: string) => `${file} is ready`,
  downloadAgain: 'Download again',
  failed: 'The export failed.',
  tryAgain: 'Try again',
  unchecked: 'The export could not be checked.',
}

/** The key of the template that holds every document of the project in one file. */
export const exportAllTemplateKey = 'full_project'
