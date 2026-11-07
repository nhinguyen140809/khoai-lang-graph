'use client'

import { CircleCheckIcon, CircleStopIcon, CircleXIcon } from 'lucide-react'

import { Spinner } from '@/shared/components/ui/spinner'
import {
  Stepper,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperTitle,
} from '@/shared/components/ui/stepper'
import type { Tone } from '@/shared/lib/tone'

import { stepperSteps } from '../../design-system.fixtures'
import { SampleCard, SampleGroup } from '../Sample'

/** The marks of the steps of the sample, by their status. */
const marks: Record<string, { color: Tone; icon: React.ReactNode; label: string }> = {
  done: { color: 'success', icon: <CircleCheckIcon />, label: 'Done' },
  running: { color: 'primary', icon: <Spinner />, label: 'In progress' },
  waiting: { color: 'warning', icon: null, label: 'Waiting for you' },
  failed: { color: 'destructive', icon: <CircleXIcon />, label: 'Failed' },
  stopped: { color: 'neutral', icon: <CircleStopIcon />, label: 'Stopped' },
}

export function StepperCard() {
  return (
    <SampleCard
      title="Progress"
      description="The stages of the work as steps, with marks without a box."
      className="flex flex-col gap-3"
    >
      <SampleGroup label="the stages">
        <Stepper
          orientation="vertical"
          value={stepperSteps.findIndex(({ status }) => status === 'running')}
        >
          {stepperSteps.map(({ key, title, status }, index) => {
            const mark = marks[status]
            return (
              <StepperItem
                key={key}
                step={index + 1}
                completed={status === 'done'}
                loading={status === 'running'}
              >
                <StepperIndicator variant="ghost" color={mark?.color}>
                  {mark?.icon ?? index + 1}
                </StepperIndicator>
                <StepperTitle>{title}</StepperTitle>
                <StepperDescription>{mark?.label}</StepperDescription>
              </StepperItem>
            )
          })}
        </Stepper>
      </SampleGroup>
    </SampleCard>
  )
}
