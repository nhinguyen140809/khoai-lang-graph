import { describe, expect, it } from 'vitest'

import { schemaProblems } from '../json-schema.utils'
import { schema, schemaProblemCases } from './json-schema.utils.data'

describe('schemaProblems', () => {
  it.each(schemaProblemCases)('reports $name', ({ value, fields }) => {
    expect(schemaProblems(schema, value, 'content').map(({ field }) => field)).toEqual(fields)
  })

  it('accepts anything when the schema is not an object', () => {
    expect(schemaProblems(undefined, 1, 'content')).toEqual([])
  })
})
