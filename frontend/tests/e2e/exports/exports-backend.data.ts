export const idea = 'A web app where students book study rooms'

/** A file that a project with a finished run exports: its name, its type, and what it holds. */
export const exportedFiles: {
  name: string
  template: string
  format: string
  fileName: string
  contentType: string
  contains: string
}[] = [
  {
    name: 'the specification as markdown',
    template: 'requirement_specification',
    format: 'markdown',
    fileName: 'requirement_specification.md',
    contentType: 'text/markdown',
    contains: '# Requirement specification',
  },
  {
    name: 'the backlog as a table',
    template: 'product_backlog',
    format: 'csv',
    fileName: 'product_backlog.csv',
    contentType: 'text/csv',
    contains: 'key,kind,outline_number',
  },
  {
    name: 'the backlog as json',
    template: 'product_backlog',
    format: 'json',
    fileName: 'product_backlog.json',
    contentType: 'application/json',
    contains: '"artifacts"',
  },
]

/** A format that no export has. */
export const unsupportedFormats = ['pdf', 'docx']
