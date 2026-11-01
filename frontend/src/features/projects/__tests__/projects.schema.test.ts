import { describe, expect, it } from 'vitest'

import { newProjectFormSchema } from '../projects.schema'

describe('newProjectFormSchema', () => {
  it('trims the fields and sends an empty description as null', () => {
    expect(
      newProjectFormSchema.parse({ name: ' Mentors ', description: '  ', output_language: 'en' }),
    ).toEqual({ name: 'Mentors', description: null, output_language: 'en' })
  })

  it('asks for a name', () => {
    const result = newProjectFormSchema.safeParse({
      name: ' ',
      description: '',
      output_language: 'en',
    })

    expect(result.error?.issues.map(({ path, message }) => [path, message])).toEqual([
      [['name'], 'Enter a name.'],
    ])
  })
})
