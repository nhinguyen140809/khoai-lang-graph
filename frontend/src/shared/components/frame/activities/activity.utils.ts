import { isAtOrUnder, pathOf } from '@/shared/lib/path.utils'

import type { Activity, FeatureActivity } from './activity.types'

export function isFeatureActivity(activity: Activity): activity is FeatureActivity {
  return 'href' in activity
}

/**
 * The feature shown when the page on screen belongs to none: the first one at the top of the bar.
 * A feature at the bottom, such as the settings, is never shown unasked.
 */
export function firstTopActivity(
  features: readonly FeatureActivity[],
): FeatureActivity | undefined {
  return features.find(({ placement }) => placement !== 'bottom')
}

/**
 * The feature that a page belongs to: of the addresses the page is at or under, the longest one
 * decides. The query and the fragment of the address do not count.
 */
export function activityOfHref(
  activities: readonly Activity[],
  href: string,
): FeatureActivity | undefined {
  const pathname = pathOf(href)
  let found: FeatureActivity | undefined
  let foundLength = -1
  for (const activity of activities) {
    if (!isFeatureActivity(activity)) continue
    for (const path of [activity.href, ...(activity.paths ?? [])].map(pathOf)) {
      if (isAtOrUnder(pathname, path) && path.length > foundLength) {
        found = activity
        foundLength = path.length
      }
    }
  }
  return found
}
