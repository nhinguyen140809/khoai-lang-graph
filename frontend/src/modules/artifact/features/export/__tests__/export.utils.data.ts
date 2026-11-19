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

export const contentsCases: { name: string; kinds: string[]; line: string }[] = [
  { name: 'one kind by its title', kinds: ['persona_catalog'], line: 'Persona catalog' },
  {
    name: 'a few kinds as a list',
    kinds: ['persona_catalog', 'interview_transcript'],
    line: 'Persona catalog, Interview transcript',
  },
  { name: 'a kind without a title by its name', kinds: ['other_kind'], line: 'other_kind' },
]

export const commonFormatCases: {
  name: string
  formats: ExportFormat[][]
  common: ExportFormat[]
}[] = [
  { name: 'none', formats: [], common: [] },
  { name: 'one document', formats: [['markdown', 'pdf']], common: ['markdown', 'pdf'] },
  {
    name: 'the types of both, in the order of the first',
    formats: [
      ['markdown', 'pdf', 'docx'],
      ['csv', 'markdown', 'pdf'],
    ],
    common: ['markdown', 'pdf'],
  },
  { name: 'documents with nothing in common', formats: [['pdf'], ['csv']], common: [] },
]

export const bodiesCases: {
  name: string
  values: { isAll: boolean; templates: string[]; format: ExportFormat }
  bodies: { template: string; format: ExportFormat }[]
}[] = [
  {
    name: 'one file for all the documents, whatever is chosen in the list',
    values: { isAll: true, templates: ['a'], format: 'json' },
    bodies: [{ template: 'full_project', format: 'json' }],
  },
  {
    name: 'one file for each document chosen',
    values: { isAll: false, templates: ['a', 'b'], format: 'markdown' },
    bodies: [
      { template: 'a', format: 'markdown' },
      { template: 'b', format: 'markdown' },
    ],
  },
]
