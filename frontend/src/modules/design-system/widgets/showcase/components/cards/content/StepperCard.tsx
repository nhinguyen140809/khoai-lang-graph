'use client'

import { cn } from 'cn'
import { ChevronRightIcon } from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/shared/components/ui/badge'
import { Stepper, StepperItem, StepperTitle, StepperTrigger } from '@/shared/components/ui/stepper'

import { type StepperStep, stepperSteps } from '../../../design-system.fixtures'
import type { CardEntry } from '../../../design-system.types'
import { SampleCard, SampleGroup } from '../../Sample'

/** How the number of a step shows, by its status: the only mark of the step. */
const markLooks = {
  not_started: { variant: 'ghost', color: 'neutral' },
  running: { variant: 'soft', color: 'primary' },
  waiting: { variant: 'solid', color: 'warning' },
  done: { variant: 'ghost', color: 'success' },
  failed: { variant: 'solid', color: 'destructive' },
  stopped: { variant: 'ghost', color: 'neutral' },
} as const

const statusLabels: Record<StepperStep['status'], string> = {
  not_started: 'Not started',
  running: 'In progress',
  waiting: 'Waiting for you',
  done: 'Done',
  failed: 'Failed',
  stopped: 'Stopped',
}

/** The stages as the side panel of the activity draws them: numbered steps, with the steps under one that is open. */
export function StepperCard() {
  const [openKey, setOpenKey] = useState<string | null>('interviewing')

  return (
    <SampleCard
      title="Progress"
      description="The stages of the work as numbered steps; a step with sub-steps opens and closes."
      className="flex flex-col gap-3"
    >
      <SampleGroup label="the stages">
        <Stepper
          orientation="vertical"
          className="flex flex-col gap-1.5 px-1"
          value={stepperSteps.findIndex(({ status }) => status === 'running') + 1}
        >
          {stepperSteps.map((step, index) => (
            <StepRow
              key={step.key}
              step={step}
              label={String(index + 1)}
              position={index + 1}
              isOpen={openKey === step.key}
              onToggle={() => {
                setOpenKey(openKey === step.key ? null : step.key)
              }}
            />
          ))}
        </Stepper>
      </SampleGroup>
    </SampleCard>
  )
}

function StepMark({ label, status }: { label: string; status: StepperStep['status'] }) {
  const look = markLooks[status]
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

interface StepRowProps {
  step: StepperStep
  label: string
  position: number
  isOpen: boolean
  onToggle: () => void
}

function StepRow({ step, label, position, isOpen, onToggle }: StepRowProps) {
  const subSteps = step.subSteps ?? []
  const hasSubSteps = subSteps.length > 0

  return (
    <StepperItem
      step={position}
      completed={step.status === 'done'}
      loading={step.status === 'running'}
      className="flex-none flex-col items-stretch justify-start"
    >
      <StepperTrigger
        aria-expanded={hasSubSteps ? isOpen : undefined}
        aria-controls={undefined}
        onClick={hasSubSteps ? onToggle : undefined}
        className="flex w-full items-center gap-x-2 rounded-md px-2 py-1.5 text-left hover:bg-sidebar-accent"
      >
        <span className="flex shrink-0">
          <StepMark label={label} status={step.status} />
        </span>
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <StepperTitle
            className={cn(
              'min-w-0 truncate text-sm leading-tight',
              step.status === 'not_started' && 'text-muted-foreground',
            )}
          >
            {step.title}
          </StepperTitle>
          <span className="sr-only">, {statusLabels[step.status]}</span>
        </span>
        {hasSubSteps && (
          <ChevronRightIcon
            aria-hidden
            className={cn('size-4 shrink-0 transition-transform', isOpen && 'rotate-90')}
          />
        )}
      </StepperTrigger>
      {hasSubSteps && isOpen && (
        <Stepper
          orientation="vertical"
          className="ml-4 flex flex-col gap-1 border-l border-border/70 pl-2"
          aria-label={step.title}
          value={subSteps.findIndex(({ status }) => status === 'running') + 1}
        >
          {subSteps.map((sub, index) => (
            <StepperItem
              key={sub.key}
              step={index + 1}
              completed={sub.status === 'done'}
              loading={sub.status === 'running'}
              aria-current={sub.status === 'running' ? 'step' : undefined}
              className={cn(
                'flex-none items-start justify-start border-l-2 border-transparent',
                sub.status === 'running' && 'border-primary',
              )}
            >
              <StepperTrigger
                aria-controls={undefined}
                className="flex w-full items-center gap-x-2 rounded-md px-2 py-1.5 text-left hover:bg-sidebar-accent"
              >
                <span className="flex shrink-0">
                  <StepMark label={`${label}.${String(index + 1)}`} status={sub.status} />
                </span>
                <StepperTitle className="min-w-0 truncate text-sm leading-tight">
                  {sub.title}
                </StepperTitle>
                <span className="sr-only">, {statusLabels[sub.status]}</span>
              </StepperTrigger>
            </StepperItem>
          ))}
        </Stepper>
      )}
    </StepperItem>
  )
}

export const stepperCardEntry = {
  id: 'stepper',
  label: 'Progress',
  section: 'content',
  span: 3,
  keywords: 'stepper progress steps badge Stepper StepperItem StepperTitle StepperTrigger',
  View: StepperCard,
} satisfies CardEntry
