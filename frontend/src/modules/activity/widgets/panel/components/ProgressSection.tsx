'use client'

import { cn } from 'cn'
import { ChevronRightIcon } from 'lucide-react'

import { usePendingInterrupt } from '@/modules/review/entities'
import type { Run, StageProgress, StageStatus, SubjectProgress } from '@/modules/run/entities'
import {
  isStageStatusCompleted,
  isStageStatusInProgress,
  useStageProgress,
  useStageStatusLook,
} from '@/modules/run/entities'
import { SidePanelSection, useOpenPage } from '@/shared/components/frame'
import { EmptyState, ErrorState, LoadingState } from '@/shared/components/state'
import { Badge } from '@/shared/components/ui/badge'
import { Collapsible, CollapsibleContent } from '@/shared/components/ui/collapsible'
import { Stepper, StepperItem, StepperTitle, StepperTrigger } from '@/shared/components/ui/stepper'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'
import { useOpenKeys } from '@/shared/lib/disclosure'
import { useView } from '@/shared/lib/view'
import { routes } from '@/shared/routes'

import { activityPanelMessages, stepMarkerLooks } from '../activity-panel.constants'

/** The keys of the stages that start open, at every depth. */
function openStageKeys(stages: readonly StageProgress[]): string[] {
  return stages.flatMap((stage) => [
    ...(stage.isOpen ? [stage.key] : []),
    ...openStageKeys(stage.children),
  ])
}

interface ProgressSectionProps {
  run: Run | null
  projectId: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

/** Progress: the stages of the workflow as steps and sub-steps, marked as the run goes. */
export function ProgressSection({ run, projectId, open, onOpenChange }: ProgressSectionProps) {
  const progress = useStageProgress(run, projectId)
  const pending = usePendingInterrupt(run?.id ?? '', {
    isEnabled: run !== null,
    runStatus: run?.status,
  })
  const stages = progress.state === 'success' ? progress.stages : []
  const openKeys = useOpenKeys(openStageKeys(stages))

  return (
    <SidePanelSection
      title={activityPanelMessages.progress}
      open={open}
      onOpenChange={onOpenChange}
    >
      {progress.state === 'pending' && (
        <LoadingState size="compact" rows={5} label={activityPanelMessages.progressLoading} />
      )}
      {progress.state === 'error' && (
        <ErrorState
          size="compact"
          message={activityPanelMessages.progressError}
          onRetry={() => {
            progress.retry()
          }}
        />
      )}
      {progress.state === 'success' &&
        (stages.length === 0 ? (
          <EmptyState size="compact" title={activityPanelMessages.notStarted} />
        ) : (
          <Stepper
            orientation="vertical"
            className="flex flex-col gap-1.5 px-1"
            value={stages.find(({ status }) => isStageStatusInProgress(status))?.number ?? 1}
          >
            {stages.map((stage) => (
              <StageItem
                key={stage.key}
                stage={stage}
                label={String(stage.number)}
                hasSubSteps={stage.children.length > 0 || stage.subjects.length > 0}
                isOpen={openKeys.isOpen(stage.key)}
                onToggle={() => {
                  openKeys.toggle(stage.key)
                }}
                openKeys={openKeys}
                pendingInterruptId={pending.data?.id ?? null}
                projectId={projectId}
              />
            ))}
          </Stepper>
        ))}
    </SidePanelSection>
  )
}

/** The number of a step, the only mark of its status: plain, soft or solid by how much it asks. */
function StepMarker({ label, status }: { label: string; status: StageStatus }) {
  const look = stepMarkerLooks[status]
  return (
    <Badge
      variant={look.variant}
      color={look.color}
      className="h-5 min-w-5 rounded-full px-1 text-3xs font-semibold tabular-nums"
    >
      {label}
    </Badge>
  )
}

interface StageItemProps {
  stage: StageProgress
  /** Its place in the tree, such as 4 or 4.2. */
  label: string
  hasSubSteps: boolean
  isOpen: boolean
  onToggle: () => void
  openKeys: ReturnType<typeof useOpenKeys>
  pendingInterruptId: string | null
  projectId: string
}

/** One step of the tree: a stage, with its sub-steps under it when they are open. */
function StageItem({
  stage,
  label,
  hasSubSteps,
  isOpen,
  onToggle,
  openKeys,
  pendingInterruptId,
  projectId,
}: StageItemProps) {
  const look = useStageStatusLook(stage.status)
  const openPage = useOpenPage()

  return (
    <StepperItem
      step={stage.number}
      completed={look.isCompleted}
      loading={look.isLoading}
      className="flex-none flex-col items-stretch justify-start"
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <StepperTrigger
            aria-expanded={hasSubSteps ? isOpen : undefined}
            id={`stage-${stage.key}`}
            {...(hasSubSteps && isOpen
              ? { 'aria-controls': `stage-${stage.key}-sub` }
              : { 'aria-controls': undefined })}
            onClick={() => {
              if (hasSubSteps) onToggle()
              else if (pendingInterruptId !== null && look.isWaiting) {
                openPage(routes.project(projectId).activity({ entryId: pendingInterruptId }))
              } else if (stage.latestWorkId !== null) {
                openPage(routes.project(projectId).activity({ entryId: stage.latestWorkId }))
              }
            }}
            className="flex w-full items-center gap-x-2 rounded-md px-2 py-1.5 text-left hover:bg-sidebar-accent"
          >
            <span className="flex shrink-0">
              <StepMarker label={label} status={stage.status} />
            </span>
            <span className="flex min-w-0 flex-1 items-center gap-2">
              <StepperTitle
                title={stage.title}
                className={cn(
                  'min-w-0 truncate text-sm leading-tight',
                  look.isNotStarted && 'text-muted-foreground',
                )}
              >
                {stage.title}
              </StepperTitle>
              <span className="sr-only">, {look.label}</span>
              {look.isWaiting && pendingInterruptId !== null && (
                <span className="sr-only">{activityPanelMessages.openReview}</span>
              )}
            </span>
            {hasSubSteps && (
              <ChevronRightIcon
                aria-hidden
                className={cn('size-4 shrink-0 transition-transform', isOpen && 'rotate-90')}
              />
            )}
          </StepperTrigger>
        </TooltipTrigger>
        <TooltipContent>
          {look.isWaiting && pendingInterruptId !== null
            ? `${look.label}, ${activityPanelMessages.openReview}`
            : look.label}
        </TooltipContent>
      </Tooltip>
      {hasSubSteps && (
        <Collapsible open={isOpen} onOpenChange={() => undefined}>
          <CollapsibleContent id={`stage-${stage.key}-sub`}>
            <Stepper
              orientation="vertical"
              className="ml-4 flex flex-col gap-1 border-l border-border/70 pl-2"
              aria-label={stage.title}
              value={
                stage.subjects.find(({ status }) => isStageStatusInProgress(status))?.number ??
                stage.subjects.filter(({ status }) => isStageStatusCompleted(status)).length + 1
              }
            >
              {stage.children.map((child) => (
                <StageItem
                  key={child.key}
                  stage={child}
                  label={`${label}.${String(child.number)}`}
                  hasSubSteps={child.children.length > 0 || child.subjects.length > 0}
                  isOpen={openKeys.isOpen(child.key)}
                  onToggle={() => {
                    openKeys.toggle(child.key)
                  }}
                  openKeys={openKeys}
                  pendingInterruptId={pendingInterruptId}
                  projectId={projectId}
                />
              ))}
              {stage.subjects.map((subject) => (
                <SubjectItem
                  key={subject.subject.id}
                  subject={subject}
                  label={`${label}.${String(subject.number)}`}
                  projectId={projectId}
                />
              ))}
            </Stepper>
          </CollapsibleContent>
        </Collapsible>
      )}
    </StepperItem>
  )
}

/** One subject of a stage that runs once for each: an interviewee, in the order the run takes them. */
function SubjectItem({
  subject,
  label,
  projectId,
}: {
  subject: SubjectProgress
  label: string
  projectId: string
}) {
  const view = useView()
  const openPage = useOpenPage()
  const look = useStageStatusLook(subject.status)
  const workId = subject.workId

  return (
    <StepperItem
      step={subject.number}
      completed={look.isCompleted}
      loading={look.isLoading}
      aria-current={look.isLoading ? 'step' : undefined}
      className={cn(
        'flex-none items-start justify-start border-l-2 border-transparent',
        look.isLoading && 'border-primary',
      )}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <StepperTrigger
            aria-controls={undefined}
            id={`subject-${subject.subject.id}`}
            {...(workId !== null && {
              onClick: () => {
                openPage(routes.project(projectId).activity({ entryId: workId }))
              },
            })}
            className="flex w-full items-center gap-x-2 rounded-md px-2 py-1.5 text-left hover:bg-sidebar-accent"
          >
            <span className="flex shrink-0">
              <StepMarker label={label} status={subject.status} />
            </span>
            <span className="flex min-w-0 flex-1 items-center gap-2">
              <StepperTitle
                title={subject.subject.title}
                className="min-w-0 truncate text-sm leading-tight"
              >
                {subject.subject.title}
              </StepperTitle>
              <span className="sr-only">, {look.label}</span>
              {view === 'developer' && (
                <span className="text-3xs text-muted-foreground">{subject.subject.key}</span>
              )}
            </span>
          </StepperTrigger>
        </TooltipTrigger>
        <TooltipContent>{look.label}</TooltipContent>
      </Tooltip>
    </StepperItem>
  )
}
