'use client'

import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react'
import { type ReactNode, useEffect, useRef } from 'react'

import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'

import { revisionMessages } from '../../revisions/revisions.constants'
import type { HistoryView, RevisionHistoryResult } from '../../revisions/revisions.types'
import { VersionItem } from './VersionItem'

interface VersionStepperProps {
  /** The state of the history surface and of the page that shows the selected version. */
  view: HistoryView
  /** The version of the record now: Newer disabled on it, no restore on it. */
  currentVersion: number
  /** The versions of the record, from `useRevisionHistory`. */
  history: RevisionHistoryResult
  /** The entries of the menu of the item of a version, from the feature that the page places. */
  renderRestore: (version: number) => ReactNode
}

/**
 * The selected version of the record: the arrows step through the versions one by one at its
 * left, and the entry of the version at its right. A button that becomes disabled moves the focus
 * to the other one, so the focus never rests on a control that no longer works.
 */
export function VersionStepper({
  view,
  currentVersion,
  history,
  renderRestore,
}: VersionStepperProps) {
  const newer = useRef<HTMLButtonElement>(null)
  const older = useRef<HTMLButtonElement>(null)
  const revision =
    history.state === 'success'
      ? history.revisions.find(({ version }) => version === view.selectedVersion)
      : undefined

  // Newer is disabled on the current version and Older on version 1; the focus moves to the other
  // one, so it never rests on a control that no longer works.
  useEffect(() => {
    if (view.selectedVersion === currentVersion && document.activeElement === newer.current) {
      older.current?.focus()
    }
    if (view.selectedVersion === 1 && document.activeElement === older.current) {
      newer.current?.focus()
    }
  }, [view.selectedVersion, currentVersion])

  // The next page loads when the step needs a version that is not loaded yet.
  const stepTo = (version: number) => {
    if (
      history.state === 'success' &&
      !history.revisions.some((entry) => entry.version === version) &&
      history.hasMore
    ) {
      void history.loadMore()
    }
    view.select(version)
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-col gap-0.5">
        <Button
          ref={newer}
          type="button"
          variant="ghost"
          color="primary"
          size="icon"
          className="w-7"
          aria-label={revisionMessages.newer}
          disabled={view.selectedVersion >= currentVersion}
          onClick={() => {
            stepTo(view.selectedVersion + 1)
          }}
        >
          <ChevronUpIcon className="size-6" />
        </Button>
        <Button
          ref={older}
          type="button"
          variant="ghost"
          color="primary"
          size="icon"
          className="w-7"
          aria-label={revisionMessages.older}
          disabled={
            view.selectedVersion <= 1 || history.state !== 'success' || history.isLoadingMore
          }
          onClick={() => {
            stepTo(view.selectedVersion - 1)
          }}
        >
          <ChevronDownIcon className="size-6" />
        </Button>
      </div>
      {revision === undefined ? (
        <Skeleton className="m-1 h-12 w-40" />
      ) : (
        <VersionItem
          revision={revision}
          isSelected
          menu={revision.version === currentVersion ? undefined : renderRestore(revision.version)}
          className="min-w-0 flex-1"
        />
      )}
    </div>
  )
}
