import Link from 'next/link'

import { cn } from '@/lib/utils'

import { itemHref } from '../artifact-links.utils'

interface ItemLinkProps {
  projectId: string
  itemId: string
  className?: string
  children: React.ReactNode
}

/** A link to an item; the key of an item is always one. */
export function ItemLink({ projectId, itemId, className, children }: ItemLinkProps) {
  return (
    <Link
      href={itemHref(projectId, itemId) as '/'}
      className={cn(
        'rounded-sm text-primary underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/50',
        className,
      )}
    >
      {children}
    </Link>
  )
}
