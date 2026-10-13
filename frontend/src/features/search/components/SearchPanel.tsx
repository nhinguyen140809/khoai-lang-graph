'use client'

import { SearchIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useDeferredValue, useState } from 'react'

import { EmptyState, ErrorState, LoadingState } from '@/shared/components/state'
import { itemHref } from '@/shared/config/routes.utils'
import { Badge } from '@/shared/ui/badge'
import { Input } from '@/shared/ui/input'

import { MIN_QUERY_LENGTH, useItemSearch } from '../hooks/useItemSearch'
import { SEARCH_RESULT_LIMIT } from '../search.api'
import { itemTitle } from '../search.utils'

interface SearchPanelProps {
  projectId: string
}

/** A box that searches the items of the project by key and content, and lists the matches. */
export function SearchPanel({ projectId }: SearchPanelProps) {
  const [text, setText] = useState('')
  const q = useDeferredValue(text)
  const search = useItemSearch(projectId, q)

  return (
    <div className="flex flex-col gap-2">
      <div className="relative px-2">
        <SearchIcon
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-4 size-3.5 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          aria-label="Search items"
          placeholder="Search items"
          value={text}
          onChange={(event) => {
            setText(event.target.value)
          }}
          className="h-7 pl-7 text-xs"
        />
      </div>
      <Results projectId={projectId} text={q.trim()} search={search} />
    </div>
  )
}

interface ResultsProps {
  projectId: string
  text: string
  search: ReturnType<typeof useItemSearch>
}

function Results({ projectId, text, search }: ResultsProps) {
  const pathname = usePathname()

  if (text.length < MIN_QUERY_LENGTH) {
    return (
      <p className="px-3 text-xs text-muted-foreground">
        Type at least {MIN_QUERY_LENGTH} letters of a key or of the text of an item.
      </p>
    )
  }
  if (search.isPending) {
    return <LoadingState label="Searching" rows={3} size="compact" className="px-3" />
  }
  if (search.isError) {
    return (
      <ErrorState
        message={search.error.message}
        onRetry={() => void search.refetch()}
        size="compact"
        className="px-3"
      />
    )
  }
  if (search.data.items.length === 0) {
    return <EmptyState title={`No items match "${text}"`} size="compact" className="px-3" />
  }

  return (
    <div className="flex flex-col gap-1 pb-2">
      <p className="px-3 text-2xs text-muted-foreground" role="status">
        {search.data.items.length}
        {search.data.next_cursor !== null && '+'}{' '}
        {search.data.items.length === 1 ? 'result' : 'results'}
        {search.data.next_cursor !== null &&
          ` (the first ${String(SEARCH_RESULT_LIMIT)}; search for more of the text)`}
      </p>
      <ul className="flex flex-col gap-px px-1">
        {search.data.items.map((item) => {
          const href = itemHref(projectId, item.id)
          return (
            <li key={item.id}>
              <Link
                href={href}
                aria-current={pathname === href ? 'page' : undefined}
                className="flex flex-col gap-0.5 rounded-md px-2 py-1.5 outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-ring/50 aria-[current=page]:bg-sidebar-accent"
              >
                <span className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono">
                    {item.key}
                  </Badge>
                  <span className="truncate text-xs font-medium text-foreground">
                    {itemTitle(item)}
                  </span>
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
