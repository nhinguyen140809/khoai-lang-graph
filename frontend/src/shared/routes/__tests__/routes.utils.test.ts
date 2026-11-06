import { describe, expect, it } from 'vitest'

import { routes } from '../routes.utils'
import { activityEntryCases, routeCases } from './routes.utils.data'

describe('the activity route', () => {
  it.each(activityEntryCases)('names its entry, $name', ({ entryId, query }) => {
    const href = routes.project('p1').activity(...(entryId !== undefined ? [{ entryId }] : []))
    const search = new URL(href, 'https://x.test').searchParams.get('entry')

    expect(search).toBe(query)
  })
})

describe('routes', () => {
  it.each(routeCases)('gives $page', ({ href, path }) => {
    expect(href()).toBe(path)
  })
})
