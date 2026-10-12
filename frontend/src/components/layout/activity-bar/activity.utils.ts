import type { Activity, FeatureActivity } from './activity.types'

export function isFeatureActivity(activity: Activity): activity is FeatureActivity {
  return 'href' in activity
}

function pathOf(href: string): string {
  return href.split(/[?#]/)[0] ?? href
}

function isAtOrUnder(pathname: string, path: string): boolean {
  return pathname === path || pathname.startsWith(`${path}/`)
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
