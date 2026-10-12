import type { Route } from 'next'
import { describe, expect, it } from 'vitest'

import type { Activity } from '../activity.types'
import { activityOfHref, isFeatureActivity } from '../activity.utils'

const activities: Activity[] = [
  {
    id: 'console',
    label: 'Console',
    icon: null,
    href: '/projects/p1/console' as Route,
    paths: ['/projects/p1/review'],
    panel: null,
  },
  {
    id: 'artifacts',
    label: 'Artifacts',
    icon: null,
    href: '/projects/p1/artifacts' as Route,
    panel: null,
  },
  {
    id: 'items',
    label: 'Items',
    icon: null,
    href: '/projects/p1/artifacts/items' as Route,
    panel: null,
  },
  { id: 'sources', label: 'Sources', icon: null, note: 'planned' },
]

describe('activityOfHref', () => {
  it('is the feature whose address the page is at or under', () => {
    expect(activityOfHref(activities, '/projects/p1/console')?.id).toBe('console')
    expect(activityOfHref(activities, '/projects/p1/artifacts/a1')?.id).toBe('artifacts')
  })

  it('counts the other addresses of a feature', () => {
    expect(activityOfHref(activities, '/projects/p1/review/r1')?.id).toBe('console')
  })

  it('takes the longest address that matches', () => {
    expect(activityOfHref(activities, '/projects/p1/artifacts/items/i1')?.id).toBe('items')
  })

  it('leaves out the query and a segment that only starts the same', () => {
    expect(activityOfHref(activities, '/projects/p1/console?thread=t1')?.id).toBe('console')
    expect(activityOfHref(activities, '/projects/p1/consoles')).toBeUndefined()
  })

  it('is undefined outside every feature', () => {
    expect(activityOfHref(activities, '/projects/p1')).toBeUndefined()
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
