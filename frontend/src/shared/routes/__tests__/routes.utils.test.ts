import { describe, expect, it } from 'vitest'

import { routeCases } from './routes.utils.data'

describe('routes', () => {
  it.each(routeCases)('gives $page', ({ href, path }) => {
    expect(href()).toBe(path)
  })
})
