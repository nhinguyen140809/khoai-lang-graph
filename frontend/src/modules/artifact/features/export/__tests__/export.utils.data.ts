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

export const startFormatCases: {
  name: string
  templates: { key: string; formats: ExportFormat[] }[]
  start: Record<string, ExportFormat>
}[] = [
  { name: 'none', templates: [], start: {} },
  {
    name: 'the first type that each document offers',
    templates: [
      { key: 'a', formats: ['markdown', 'pdf'] },
      { key: 'b', formats: ['csv', 'json'] },
    ],
    start: { a: 'markdown', b: 'csv' },
  },
  {
    name: 'nothing for a document that offers no type',
    templates: [{ key: 'a', formats: [] }],
    start: {},
  },
]

export const bodiesCases: {
  name: string
  values: { isAll: boolean; templates: string[]; formats: Record<string, ExportFormat> }
  bodies: { template: string; format: ExportFormat }[]
}[] = [
  {
    name: 'one file for all the documents, whatever is chosen in the list',
    values: { isAll: true, templates: ['a'], formats: { a: 'pdf', full_project: 'json' } },
    bodies: [{ template: 'full_project', format: 'json' }],
  },
  {
    name: 'one file for each document chosen, each in its own file type',
    values: { isAll: false, templates: ['a', 'b'], formats: { a: 'markdown', b: 'csv' } },
    bodies: [
      { template: 'a', format: 'markdown' },
      { template: 'b', format: 'csv' },
    ],
  },
  {
    name: 'nothing for a document that has no file type chosen',
    values: { isAll: false, templates: ['a', 'x'], formats: { a: 'pdf' } },
    bodies: [{ template: 'a', format: 'pdf' }],
  },
]
