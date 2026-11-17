/** The words of exporting the documents of a project. */
export const exportMessages = {
  button: 'Export',
  dialogTitle: 'Export',
  template: 'Document',
  format: 'Format',
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
