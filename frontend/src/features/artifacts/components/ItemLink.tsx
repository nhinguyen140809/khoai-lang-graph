import Link from 'next/link'

import { routes } from '@/shared/config/routes'
import { cn } from '@/shared/lib/utils'

import { useItemOpen } from './ItemOpenContext'

interface ItemLinkProps {
  projectId: string
  itemId: string
  className?: string
  children: React.ReactNode
}

/** A link to an item; the key of an item is always one. */
export function ItemLink({ projectId, itemId, className, children }: ItemLinkProps) {
  const open = useItemOpen()
  const style = cn(
    'rounded-sm text-primary underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/50',
    className,
  )
  if (open !== null) {
    return (
      <button
        type="button"
        className={cn(style, 'text-left')}
        onClick={() => {
          open(itemId)
        }}
      >
        {children}
      </button>
    )
  }
  return (
    <Link href={routes.project(projectId).item(itemId)} className={style}>
      {children}
    </Link>
  )
}
