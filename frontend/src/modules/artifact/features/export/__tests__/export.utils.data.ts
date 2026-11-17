import type { ExportFormat } from '@/modules/workflow/entities'

/** A template, a format, and the name of the file in the words of the user. */
export const fileLabelCases: {
  name: string
  template: { title: string } | undefined
  format: ExportFormat
  label: string
}[] = [
  {
    name: 'the specification as PDF',
    template: { title: 'Requirement specification' },
    format: 'pdf',
    label: 'Requirement specification (PDF)',
  },
  {
    name: 'the user stories as a Word file',
    template: { title: 'User stories' },
    format: 'docx',
    label: 'User stories (Word)',
  },
  {
    name: 'a template that the definition no longer has',
    template: undefined,
    format: 'json',
    label: 'The document (JSON)',
  },
]
