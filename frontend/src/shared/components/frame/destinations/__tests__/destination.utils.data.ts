import type { Route } from 'next'

import type { Destination } from '../destination.types'

/** Three features, one of them under another, and a planned one. */
export const destinations: Destination[] = [
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

/** The address of a page, and the id of the feature of `destinations` that it belongs to. */
export const destinationOfHrefCases = [
  { name: 'the address of a feature', href: '/projects/p1/console', id: 'console' },
  {
    name: 'a page under the address of a feature',
    href: '/projects/p1/artifacts/a1',
    id: 'artifacts',
  },
  {
    name: 'a page under another address of a feature',
    href: '/projects/p1/review/r1',
    id: 'console',
  },
  {
    name: 'the longest address that matches',
    href: '/projects/p1/artifacts/items/i1',
    id: 'items',
  },
  { name: 'an address with a query', href: '/projects/p1/console?thread=t1', id: 'console' },
  { name: 'an address with a fragment', href: '/projects/p1/artifacts#a1', id: 'artifacts' },
  {
    name: 'none for a segment that only starts the same',
    href: '/projects/p1/consoles',
    id: undefined,
  },
  { name: 'none outside every feature', href: '/projects/p1', id: undefined },
]
