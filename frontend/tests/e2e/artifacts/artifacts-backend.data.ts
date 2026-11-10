export const idea = 'A web app where students book study rooms'

/** The artifacts that a run to its end leaves in the project. */
export const finishedArtifactKinds = [
  'elicitation_plan',
  'persona_catalog',
  'requirement_specification',
  'product_backlog',
]

/** A read of the traceability of a project: what it asks for and what the answer holds. */
export const traceReads: { name: string; path: string; field: string }[] = [
  { name: 'the coverage', path: 'traceability/coverage', field: 'gaps' },
  { name: 'the matrix', path: 'traceability/matrix', field: 'rows' },
]
