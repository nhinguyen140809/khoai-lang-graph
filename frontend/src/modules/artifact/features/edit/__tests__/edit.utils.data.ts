import { contentSchemaFixtureByKind } from '@/mocks/workflow/artifact-kinds.fixtures'
import { contentFields } from '@/modules/workflow/entities'

/** The fields of the schema of a spec requirement. */
export const fields = contentFields(contentSchemaFixtureByKind('spec_requirement'))

/** The content of a spec requirement as the fixture holds it. */
export const before = {
  title: 'Search mentors',
  statement: 'The system shall let a student search mentors by field of study.',
  type: 'functional',
  quality_category: null,
  priority: 'must',
  rationale: 'Because.',
  acceptance_criteria: ['Given'],
  fit_criterion: null,
  verification_method: 'test',
}

/** The first value of each field, for a content that holds none. */
export const initial = {
  title: '',
  statement: '',
  type: '',
  quality_category: null,
  priority: '',
  rationale: '',
  acceptance_criteria: [],
  fit_criterion: null,
  verification_method: '',
}
