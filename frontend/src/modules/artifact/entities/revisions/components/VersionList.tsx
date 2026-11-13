'use client'

import type { ReactNode } from 'react'

import { Reveal } from '@/shared/components/animation'
import { PendingButton } from '@/shared/components/ui/pending-button'
import { ScrollArea } from '@/shared/components/ui/scroll-area'

import { revisionMessages } from '../../revisions/revisions.constants'
import type { HistoryView, RevisionHistoryResult } from '../../revisions/revisions.types'
import { VersionItem } from './VersionItem'

interface VersionListProps {
  /** The state of the history surface: the version the list selects. */
  view: HistoryView
  /** The version of the record now: no menu on the item of it. */
  currentVersion: number
  /** The versions of the record, from `useRevisionHistory`. */
  history: RevisionHistoryResult
  /** The entries of the menu of the item of a version, from the feature that the page places. */
  renderRestore: (version: number) => ReactNode
}

/**
 * Every loaded version of the record, newest first, as buttons that select one; the selected one
 * is the current stop of the reader. Show older versions loads the next page under the last one.
 */
export function VersionList({ view, currentVersion, history, renderRestore }: VersionListProps) {
  return (
    <ScrollArea className="max-h-history-list">
      <div className="space-y-1 pb-1">
        {history.state === 'success' &&
          history.revisions.map((revision, index) => (
            <Reveal key={revision.version} index={index}>
              <VersionItem
                revision={revision}
                isSelected={revision.version === view.selectedVersion}
                onSelect={() => {
                  view.select(revision.version)
                }}
                menu={
                  revision.version === currentVersion ? undefined : renderRestore(revision.version)
                }
              />
            </Reveal>
          ))}
        {history.state === 'success' && history.hasMore && (
          <PendingButton
            className="w-full"
            size="xs"
            variant="ghost"
            pending={history.isLoadingMore}
            pendingLabel={revisionMessages.showOlder}
            onClick={() => void history.loadMore()}
          >
            {revisionMessages.showOlder}
          </PendingButton>
        )}
      </div>
    </ScrollArea>
  )
}
