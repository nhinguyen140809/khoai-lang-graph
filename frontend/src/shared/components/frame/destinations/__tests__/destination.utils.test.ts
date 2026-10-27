import { describe, expect, it } from 'vitest'

import { destinationOfHref, isFeatureDestination } from '../destination.utils'
import { destinationOfHrefCases, destinations } from './destination.utils.data'

describe('destinationOfHref', () => {
  it.each(destinationOfHrefCases)('gives the feature of $name', ({ href, id }) => {
    expect(destinationOfHref(destinations, href)?.id).toBe(id)
  })

  it('gives no feature from an empty list', () => {
    expect(destinationOfHref([], '/projects/p1/console')).toBeUndefined()
  })
})

describe('isFeatureDestination', () => {
  it('tells a feature from a planned one', () => {
    expect(destinations.filter(isFeatureDestination).map(({ id }) => id)).toEqual([
      'console',
      'artifacts',
      'items',
    ])
  })
})
