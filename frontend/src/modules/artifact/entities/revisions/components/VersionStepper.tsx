'use client'

import { ChevronDownIcon, ChevronUpIcon, type LucideIcon } from 'lucide-react'
import { type ReactNode, useEffect, useRef, useState } from 'react'

import { DirectionalSwap, type SlideDirection } from '@/shared/components/animation'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { isFocused } from '@/shared/lib/viewport'

import { revisionMessages, versionSwap } from '../../revisions/revisions.constants'
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
 * One of the two arrows of the stepper: only its stroke, with no padding and no fill in any state.
 * The stroke is the text color, turns primary on the pointer and on the focus, and is muted once
 * the arrow cannot step any further.
 */
function StepArrow({
  icon: Icon,
  ...props
}: React.ComponentProps<typeof Button> & { icon: LucideIcon }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-auto border-0 p-0 text-foreground hover:bg-transparent! hover:text-primary focus-visible:bg-transparent! focus-visible:text-primary disabled:text-muted-foreground/40 disabled:opacity-100 aria-expanded:bg-transparent!"
      {...props}
    >
      <Icon aria-hidden className="size-6" strokeWidth={2.5} />
    </Button>
  )
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

  // Stepping to an older version moves the content up, as the list of versions runs down the
  // page, and stepping to a newer one moves it down.
  const [shown, setShown] = useState<{ version: number; direction: SlideDirection }>({
    version: view.selectedVersion,
    direction: 'up',
  })
  if (shown.version !== view.selectedVersion) {
    setShown({
      version: view.selectedVersion,
      direction: view.selectedVersion < shown.version ? 'up' : 'down',
    })
  }

  // Newer is disabled on the current version and Older on version 1; the focus moves to the other
  // one, so it never rests on a control that no longer works.
  useEffect(() => {
    if (view.selectedVersion === currentVersion && isFocused(newer.current)) {
      older.current?.focus()
    }
    if (view.selectedVersion === 1 && isFocused(older.current)) {
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
        <StepArrow
          ref={newer}
          icon={ChevronUpIcon}
          aria-label={revisionMessages.newer}
          disabled={view.selectedVersion >= currentVersion}
          onClick={() => {
            stepTo(view.selectedVersion + 1)
          }}
        />
        <StepArrow
          ref={older}
          icon={ChevronDownIcon}
          aria-label={revisionMessages.older}
          disabled={
            view.selectedVersion <= 1 || history.state !== 'success' || history.isLoadingMore
          }
          onClick={() => {
            stepTo(view.selectedVersion - 1)
          }}
        />
      </div>
      <DirectionalSwap
        swapKey={view.selectedVersion}
        direction={shown.direction}
        {...versionSwap}
        className="min-w-0 flex-1"
      >
        {revision === undefined ? (
          <Skeleton className="m-1 h-12 w-40" />
        ) : (
          <VersionItem
            revision={revision}
            isSelected
            menu={revision.version === currentVersion ? undefined : renderRestore(revision.version)}
          />
        )}
      </DirectionalSwap>
    </div>
  )
}
