'use client'

import { ChevronRightIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { entryAuthorNames } from '../activity.constants'
import type { EntryAuthor } from '../activity.types'

const authorMarks: Record<EntryAuthor, ReactNode> = {
  user: <ChevronRightIcon />,
  agent: <span className="size-1.5 rounded-full bg-primary" />,
  system: <span className="size-1.5 rounded-full bg-muted-foreground" />,
}

interface ActivityEntryProps {
  author: EntryAuthor
  /** The small mark at the start, such as a spinner while a step runs; by default, the one of the author. */
  mark?: ReactNode
  /**
   * Buttons under the entry, such as `CopyEntryAction`. They show while the pointer is over the
   * entry or the focus is on one of them, and always on a touch screen.
   */
  actions?: ReactNode
  children: ReactNode
}

/**
 * One entry of the activity: a message of the user, what the agents write, or an event of a run.
 * It spans the width of the activity, in the text font, with a small mark at its start instead of
 * an avatar; the entries of the user have a fill of their own.
 */
export function ActivityEntry({ author, mark, actions, children }: ActivityEntryProps) {
  return (
    <div
      data-author={author}
      className="group/entry flex gap-3 rounded-lg px-3 py-2 data-[author=user]:bg-muted"
    >
      <span
        aria-hidden
        className="flex h-6 w-4 shrink-0 items-center justify-center text-muted-foreground [&_svg]:size-4"
      >
        {mark ?? authorMarks[author]}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1 text-sm leading-6">
        <span className="sr-only">{entryAuthorNames[author]}:</span>
        {children}
        {actions !== undefined && (
          <div className="-ml-1.5 flex items-center gap-0.5 opacity-0 group-hover/entry:opacity-100 focus-within:opacity-100 pointer-coarse:opacity-100">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
