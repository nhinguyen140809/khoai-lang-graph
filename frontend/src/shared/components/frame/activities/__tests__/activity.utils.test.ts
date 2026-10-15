import { describe, expect, it } from 'vitest'

import { activityOfHref, isFeatureActivity } from '../activity.utils'
import { activities, activityOfHrefCases } from './activity.utils.data'

describe('activityOfHref', () => {
  it.each(activityOfHrefCases)('gives the feature of $name', ({ href, id }) => {
    expect(activityOfHref(activities, href)?.id).toBe(id)
  })

  it('gives no feature from an empty list', () => {
    expect(activityOfHref([], '/projects/p1/console')).toBeUndefined()
  })
})

describe('isFeatureActivity', () => {
  it('tells a feature from a planned one', () => {
    expect(activities.filter(isFeatureActivity).map(({ id }) => id)).toEqual([
      'console',
      'artifacts',
      'items',
    ])
  })
})
