import { describe, expect, it } from 'vitest'

import { restrictImports } from '../restrict-imports.utils.js'

describe('restrictImports', () => {
  it('leaves out the list that is not given', () => {
    expect(restrictImports({ patterns: [{ group: ['a'] }] })).toEqual({
      'no-restricted-imports': ['error', { patterns: [{ group: ['a'] }] }],
    })
  })

  it('gives both lists when both are given', () => {
    const options = restrictImports({ paths: [{ name: 'x' }], patterns: [{ group: ['a'] }] })
    expect(options['no-restricted-imports'][1]).toEqual({
      paths: [{ name: 'x' }],
      patterns: [{ group: ['a'] }],
    })
  })
})
