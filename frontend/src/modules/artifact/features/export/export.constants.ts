import {
  FileIcon,
  FileJsonIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  FileTypeIcon,
} from 'lucide-react'

import type { ExportFormat } from '@/modules/workflow/entities'

/** The words of exporting the documents of a project. */
export const exportMessages = {
  button: 'Export',
  dialogTitle: 'Export',
  template: 'Documents',
  templateHint: 'Choose one or more. Each one comes as its own file.',
  all: 'All documents',
  allHint: 'In one file',
  selectAll: 'Select all',
  clearAll: 'Clear',
  chooseOne: 'Choose at least one document.',
  noCommonFormat: 'These documents share no file type. Choose fewer of them.',
  format: 'File type',
  formatHint: 'Only the file types that every chosen document offers.',
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

/** What each file type is for, with its icon, in the words of the user. */
export const exportFormatLooks = {
  markdown: { icon: FileTextIcon, hint: 'Plain text you can edit anywhere' },
  pdf: { icon: FileIcon, hint: 'Fixed layout, to read or share' },
  docx: { icon: FileTypeIcon, hint: 'Opens and edits in Word' },
  csv: { icon: FileSpreadsheetIcon, hint: 'Rows for a spreadsheet' },
  json: { icon: FileJsonIcon, hint: 'Data for other tools' },
} as const satisfies Record<ExportFormat, { icon: typeof FileIcon; hint: string }>

/** The key of the template that holds every document of the project in one file. */
export const exportAllTemplateKey = 'full_project'
