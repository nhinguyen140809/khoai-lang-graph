import { type AnchorHTMLAttributes, createElement, type MouseEvent, type ReactNode } from 'react'
import { vi } from 'vitest'

// Stand-ins for next/navigation and next/link in unit tests, which run without the Next.js
// router. A test file sets them up with:
//
//   vi.mock('next/navigation', async () => (await import('@/test/next-stubs/next-stubs.utils')).navigationMock)
//   vi.mock('next/link', async () => (await import('@/test/next-stubs/next-stubs.utils')).linkMock)
//
// and sets the current address with `setPathname('/projects/p1/console')`.

let pathname = '/'
let search = ''

export function setPathname(next: string) {
  pathname = next
}

/** Sets the query of the current address, such as `step=abc`. */
export function setQuery(next: string) {
  query = next
}

/** Puts the address back to the root without a query. */
export function resetNextStubs() {
  pathname = '/'
  query = ''
}

export const routerMock = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  prefetch: vi.fn(),
  refresh: vi.fn(),
}

export const navigationMock = {
  usePathname: () => pathname,
  useRouter: () => routerMock,
  useSearchParams: () => new URLSearchParams(search),
  useParams: () => ({}),
}

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children?: ReactNode }

export const linkMock = {
  // A plain anchor; jsdom cannot navigate, so the default action is prevented after onClick.
  default: ({ href, children, onClick, ...props }: LinkProps) =>
    createElement(
      'a',
      {
        href,
        ...props,
        onClick: (event: MouseEvent<HTMLAnchorElement>) => {
          onClick?.(event)
          event.preventDefault()
        },
      },
      children,
    ),
}
