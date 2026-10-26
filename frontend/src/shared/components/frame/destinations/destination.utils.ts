import { isAtOrUnder, pathOf } from '@/shared/lib/url'

import type { Destination, FeatureDestination } from './destination.types'

export function isFeatureDestination(destination: Destination): destination is FeatureDestination {
  return 'href' in destination
}

/**
 * The feature that a page belongs to: of the addresses the page is at or under, the longest one
 * decides. The query and the fragment of the address do not count.
 */
export function destinationOfHref(
  destinations: readonly Destination[],
  href: string,
): FeatureDestination | undefined {
  const pathname = pathOf(href)
  let found: FeatureDestination | undefined
  let foundLength = -1
  for (const destination of destinations) {
    if (!isFeatureDestination(destination)) continue
    for (const path of [destination.href, ...(destination.paths ?? [])].map(pathOf)) {
      if (isAtOrUnder(pathname, path) && path.length > foundLength) {
        found = destination
        foundLength = path.length
      }
    }
  }
  return found
}
