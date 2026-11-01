import { describe, expect, it } from 'vitest'

import { exportFormSchema, itemFormSchema } from '../artifacts.schema'
import { fieldViews } from '../field-view.utils'

const views = fieldViews({
  title: 'Story',
  required: ['title'],
  properties: {
    title: { type: 'string' },
    points: { type: ['integer', 'null'], minimum: 1 },
    key: { type: 'string', readOnly: true },
  },
})

describe('itemFormSchema', () => {
  const schema = itemFormSchema(views)

  it('gives the content to store, without the fields set by the system', () => {
    expect(schema.parse({ title: 'Book a mentor', points: '3', key: 'US-001' })).toEqual({
      title: 'Book a mentor',
      points: 3,
    })
    expect(schema.parse({ title: 'Book a mentor', points: '' })).toEqual({
      title: 'Book a mentor',
      points: null,
    })
  })

  it('names the field of each problem', () => {
    const result = schema.safeParse({ title: '', points: '0' })

    expect(result.error?.issues.map(({ path, message }) => [path, message])).toEqual([
      [['title'], 'Enter a value.'],
      [['points'], 'Enter 1 or more.'],
    ])
  })
})

describe('exportFormSchema', () => {
  it('asks for a template and a format', () => {
    expect(exportFormSchema.parse({ template: 'srs', format: 'pdf' })).toEqual({
      template: 'srs',
      format: 'pdf',
    })
    expect(
      exportFormSchema
        .safeParse({ template: '', format: '' })
        .error?.issues.map(({ message }) => message),
    ).toEqual(['Choose a template.', 'Choose a format.'])
  })
})
