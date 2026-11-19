import { describe, expect, it } from 'vitest'

import type { ContentSchema } from '../../../artifact-kinds/artifact-kinds.types'
import { listColumns } from '../content-fields.utils'

const properties = {
  title: { type: 'string' },
  type: { type: 'string' },
  priority: { type: 'string' },
} as const

function schemaWith(columns: string[] | undefined): ContentSchema {
  return {
    title: 'Kind',
    ...(columns !== undefined && { 'x-ui-list-fields': columns }),
    properties,
  }
}

const describeColumn = (column: ReturnType<typeof listColumns>[number]) =>
  column.type === 'key' ? 'key' : column.field.name

describe('listColumns', () => {
  it('puts the key where the list names it, among the fields', () => {
    const columns = listColumns(schemaWith(['title', 'type', 'key', 'priority']))

    expect(columns.map(describeColumn)).toEqual(['title', 'type', 'key', 'priority'])
  })

  it('shows no key for a kind that does not name it', () => {
    const columns = listColumns(schemaWith(['title', 'type']))

    expect(columns.map(describeColumn)).toEqual(['title', 'type'])
  })

  it('leaves out a name that is no field, and shows the first fields of a kind without a list', () => {
    expect(listColumns(schemaWith(['title', 'missing'])).map(describeColumn)).toEqual(['title'])
    expect(listColumns(schemaWith(undefined)).map(describeColumn)).toEqual([
      'title',
      'type',
      'priority',
    ])
  })
})
