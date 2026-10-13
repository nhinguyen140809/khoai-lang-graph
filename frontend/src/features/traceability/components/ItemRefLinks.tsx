import Link from 'next/link'

import { itemHref } from '@/shared/config/routes.utils'

import type { ItemRef } from '../traceability.types'

/** Items as links to Artifacts, with the title on hover; a dash when there is none. */
export function ItemRefLinks({ projectId, items }: { projectId: string; items: ItemRef[] }) {
  if (items.length === 0) return <span className="text-muted-foreground">-</span>
  return (
    <span className="flex flex-wrap gap-x-2 gap-y-0.5 font-mono">
      {items.map((item) => (
        <Link
          key={item.item_id}
          href={itemHref(projectId, item.item_id)}
          title={item.title}
          className="rounded-sm text-primary underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          {item.key}
        </Link>
      ))}
    </span>
  )
}
