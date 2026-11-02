import type { Route } from 'next'

/** A page opened with the side panel hidden, and the side panel and tab that follow. */
export const openPageCases: {
  name: string
  href: Route
  options?: { keep?: boolean; inPlace?: boolean }
  chosen: string | null
  sideVisible: boolean
  keepNext: string | null
}[] = [
  {
    name: 'a page of a feature, and shows its side panel',
    href: '/projects/p1/artifacts?export=' as Route,
    chosen: 'artifacts',
    sideVisible: true,
    keepNext: null,
  },
  {
    name: 'a page that belongs to no feature, and leaves the side panel',
    href: '/',
    chosen: null,
    sideVisible: false,
    keepNext: null,
  },
  {
    name: 'a page whose tab is to be kept, and asks to keep it',
    href: '/projects/p1/artifacts/a1' as Route,
    options: { keep: true },
    chosen: 'artifacts',
    sideVisible: true,
    keepNext: '/projects/p1/artifacts/a1',
  },
]
