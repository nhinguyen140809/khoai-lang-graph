'use client'

import { cn } from 'cn'
import { ChevronsDownIcon, ChevronUpIcon, HistoryIcon } from 'lucide-react'
import { type KeyboardEventHandler, type ReactNode, useEffect, useRef } from 'react'

import { AnimatedSize } from '@/shared/components/animation'
import { ErrorState } from '@/shared/components/state'
import { Button } from '@/shared/components/ui/button'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { DisabledReason } from '@/shared/components/ui/disabled-reason'
import { FloatingSurface } from '@/shared/components/ui/floating-surface'

import { useRevisionHistory } from '../../revisions/hooks/useRevisionQueries'
import { revisionMessages } from '../../revisions/revisions.constants'
import type { HistoryLevel, HistoryView, RevisionTarget } from '../../revisions/revisions.types'
import { VersionList } from './VersionList'
import { VersionStepper } from './VersionStepper'

interface HistorySurfaceProps {
  target: RevisionTarget
  /** The version of the record now: Newer disabled on it, no restore on it. */
  currentVersion: number
  /** The state from `useHistoryView`, which the page also gives to `RevisionContent`. */
  view: HistoryView
  /** The entries of the menu of the item of a version, such as its restore, from the feature that the page places; not called for the current version. */
  renderRestore: (version: number) => ReactNode
}

/**
 * The thin bar above the content of the history surface: it minimizes the surface back to its
 * button. It stays a thin strip with a small arrow in the muted color of the sides, and takes a
 * background on the pointer, so it is easy to hit and to see.
 */
function MinimizeBar({ onClick }: { onClick: () => void }) {
  return (
    <div className="pb-2">
      <button
        type="button"
        aria-label={revisionMessages.minimize}
        onClick={onClick}
        className="flex h-4 w-full items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <ChevronUpIcon aria-hidden className="size-3.5" />
      </button>
    </div>
  )
}

/**
 * The centered line under the content of the history surface: it opens the list of every version
 * or collapses it back to the stepper. A small line of muted text with an arrow that turns to
 * point the way it goes, and takes a background on the pointer.
 */
function ExpandLine({
  label,
  isExpanded,
  onClick,
}: {
  label: string
  isExpanded: boolean
  onClick: () => void
}) {
  return (
    <div className="pt-2">
      <button
        type="button"
        aria-label={label}
        onClick={onClick}
        className="flex w-full items-center justify-center gap-1 rounded-md py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        {label}
        <ChevronsDownIcon
          aria-hidden
          className={cn(
            'size-3 transition-transform duration-200 motion-reduce:transition-none',
            isExpanded && 'rotate-180',
          )}
        />
      </button>
    </div>
  )
}

/**
 * One surface for every level, so that it grows and shrinks between them instead of being
 * replaced. What a level brings in fades in while the surface moves to its size. While it is
 * closed the surface is the button itself: no padding of its own, so the focus ring of the button
 * runs around the whole surface.
 */
function HistoryFrame({
  contentClassName,
  onKeyDown,
  children,
}: {
  contentClassName?: string
  onKeyDown?: KeyboardEventHandler<HTMLDivElement>
  children: ReactNode
}) {
  return (
    <FloatingSurface corner="top-right" variant="glass" size="none" onKeyDown={onKeyDown}>
      <AnimatedSize contentClassName={contentClassName}>{children}</AnimatedSize>
    </FloatingSurface>
  )
}

interface HistoryContentProps extends Pick<
  HistorySurfaceProps,
  'view' | 'currentVersion' | 'renderRestore'
> {
  history: ReturnType<typeof useRevisionHistory>
}

/** What the surface shows under its heading: the error, the list of versions or the stepper. */
function HistoryContent({ view, history, currentVersion, renderRestore }: HistoryContentProps) {
  if (history.state === 'error') {
    return (
      <ErrorState size="compact" message={revisionMessages.loadError} onRetry={history.retry} />
    )
  }
  if (view.level === 'list') {
    return (
      <VersionList
        view={view}
        history={history}
        currentVersion={currentVersion}
        renderRestore={renderRestore}
      />
    )
  }
  return (
    <VersionStepper
      view={view}
      currentVersion={currentVersion}
      history={history}
      renderRestore={renderRestore}
    />
  )
}

/**
 * The history of a record in the top right corner of its page, in three levels: the History
 * button; the selected version with the arrows that step through the versions; the list of every
 * version in the place of the arrows. The button opens the stepper, the "Show all versions" line
 * the list, the "Collapse" line and the bar above the content go one level back, and the heading,
 * its icon and the Show changes tick stay in place across the levels. Not modal: the page
 * scrolls and takes clicks while the surface is open.
 */
export function HistorySurface({
  target,
  currentVersion,
  view,
  renderRestore,
}: HistorySurfaceProps) {
  const button = useRef<HTMLButtonElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const isOpen = view.level !== 'closed'
  // The versions load only while the surface shows; the page draws the selected version.
  const history = useRevisionHistory(target, { isEnabled: isOpen })

  // Opening moves the focus to the heading of the surface; a new current version (a restore)
  // keeps the surface open and moves the focus to it, since the restore button of the old
  // version is gone by then.
  useEffect(() => {
    if (isOpen) heading.current?.focus()
  }, [isOpen, currentVersion])
  // Closing returns the focus to the History button.
  useEffect(() => {
    if (view.level === 'closed') button.current?.focus()
  }, [view.level])

  // Stepping a level down (Escape) moves the focus to the heading of the surface, so it stays
  // inside it and the next Escape reaches it too; closing is handled above.
  const steps = useRef<Record<HistoryLevel, number>>({ closed: 0, version: 1, list: 2 })
  const previousLevel = useRef(view.level)
  useEffect(() => {
    if (
      steps.current[view.level] < steps.current[previousLevel.current] &&
      view.level !== 'closed'
    ) {
      heading.current?.focus()
    }
    previousLevel.current = view.level
  }, [view.level])

  if (!isOpen) {
    return (
      <HistoryFrame>
        <div key="closed" className="animate-in duration-200 fade-in-0 motion-reduce:animate-none">
          <Button
            ref={button}
            type="button"
            variant="ghost"
            aria-expanded="false"
            onClick={view.open}
          >
            <HistoryIcon data-icon="inline-start" />
            {revisionMessages.title}
          </Button>
        </div>
      </HistoryFrame>
    )
  }

  return (
    <HistoryFrame
      contentClassName="w-80"
      onKeyDown={(event) => {
        // Escape steps the levels down: the list to the stepper, the stepper to closed.
        if (event.key === 'Escape') {
          event.stopPropagation()
          view.stepBack()
        }
      }}
    >
      <div key="open" className="animate-in duration-200 fade-in-0 motion-reduce:animate-none">
        <MinimizeBar onClick={view.close} />
        <div className="space-y-3 px-3">
          <header className="flex items-center justify-between gap-2">
            <h2
              ref={heading}
              tabIndex={-1}
              className="flex items-center gap-1.5 text-lg font-semibold focus-visible:outline-none"
            >
              <HistoryIcon aria-hidden className="size-5" />
              {revisionMessages.title}
            </h2>
            <DisabledReason
              reason={view.selectedVersion === 1 ? revisionMessages.firstVersion : null}
            >
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={view.showsChanges}
                  onCheckedChange={(checked) => {
                    view.setShowsChanges(checked === true)
                  }}
                  disabled={view.selectedVersion === 1}
                />
                {revisionMessages.showChanges}
              </label>
            </DisabledReason>
          </header>
          <div
            key={view.level}
            className="animate-in duration-200 fade-in-0 motion-reduce:animate-none"
          >
            <HistoryContent
              view={view}
              history={history}
              currentVersion={currentVersion}
              renderRestore={renderRestore}
            />
          </div>
        </div>
        {history.state !== 'error' && (
          <ExpandLine
            label={view.level === 'list' ? revisionMessages.collapse : revisionMessages.showAll}
            isExpanded={view.level === 'list'}
            onClick={view.toggleList}
          />
        )}
      </div>
    </HistoryFrame>
  )
}
