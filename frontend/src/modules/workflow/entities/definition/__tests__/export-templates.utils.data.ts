import type { ExportTemplate } from '../export-templates.types'

const specification: ExportTemplate = {
  key: 'requirement_specification',
  title: 'Requirement specification',
  artifact_kinds: ['requirement_specification'],
  formats: ['markdown', 'pdf', 'docx'],
}
const table: ExportTemplate = {
  key: 'traceability_matrix',
  title: 'Requirement-to-source table',
  artifact_kinds: ['requirement_specification', 'requirements_analysis'],
  formats: ['csv', 'markdown'],
}
const all: ExportTemplate = {
  key: 'full_project',
  title: 'All documents',
  artifact_kinds: ['requirement_specification', 'requirements_analysis', 'interview_plan'],
  formats: ['json', 'markdown'],
}

/** The templates of a definition, a kind, and the keys of the templates it offers, in order. */
export const templatesOfCases: { name: string; kind: string; keys: string[] }[] = [
  {
    name: 'the specification, the most specific first',
    kind: 'requirement_specification',
    keys: ['requirement_specification', 'traceability_matrix', 'full_project'],
  },
  { name: 'the plan, in one template', kind: 'interview_plan', keys: ['full_project'] },
  { name: 'a kind that no template holds', kind: 'persona', keys: [] },
]

/** The templates, out of order, that the cases read. */
export const definedTemplates = [all, specification, table]
