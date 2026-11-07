import { describe, expect, it } from 'vitest'

import { pluralForm } from '../plural.utils'

describe('pluralForm', () => {
  it.each([
    { count: 0, form: 'minutes' },
    { count: 1, form: 'minute' },
    { count: 2, form: 'minutes' },
  ])('reads "$form" for $count', ({ count, form }) => {
    expect(pluralForm(count, { one: 'minute', other: 'minutes' })).toBe(form)
  })
})
