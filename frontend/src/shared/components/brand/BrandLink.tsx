import type { Route } from 'next'
import Link from 'next/link'

import { cn } from '@/shared/lib/cn'

import { AppName } from './AppName'
import type { BrandVariant } from './brand.types'
import { Wordmark } from './Wordmark'

interface BrandLinkProps {
  /** The address of the home page, from `routes` or `userRoutes`. */
  href: Route
  /** The mark and the name of the app (`full`), or the name alone (`name`). */
  display?: 'full' | 'name'
  variant?: BrandVariant
  /** The size and the place of the link, such as the size of its text. */
  className?: string
}

/**
 * The app as a link to its home page, the same in every frame: it takes the focus ring of the
 * links of a bar, and gives its text size and place to the class of the caller.
 */
export function BrandLink({
  href,
  display = 'full',
  variant = 'brand',
  className,
}: BrandLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        'flex min-w-0 cursor-pointer items-center rounded-md px-1 outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
        className,
      )}
    >
      {display === 'full' ? <AppName variant={variant} /> : <Wordmark variant={variant} />}
    </Link>
  )
}
