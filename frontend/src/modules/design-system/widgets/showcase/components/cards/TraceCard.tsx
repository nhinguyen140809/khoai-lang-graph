'use client'

import { CheckIcon, CirclePauseIcon, PencilIcon, PlusIcon, XIcon } from 'lucide-react'

import { Spinner } from '@/shared/components/ui/spinner'
import {
  Trace,
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceDescription,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from '@/shared/components/ui/trace'
import type { Tone } from '@/shared/lib/tone'

import { traceRows } from '../../design-system.fixtures'
import { SampleCard } from '../Sample'

/** How a line of work shows, by its status: the tone of its color, its mark and the status of its trace line. */
const looks: Record<
  string,
  { tone: Tone; icon: React.ReactNode; traceStatus: 'running' | 'error' | undefined }
> = {
  done: { tone: 'success', icon: <CheckIcon />, traceStatus: undefined },
  running: { tone: 'primary', icon: <Spinner />, traceStatus: 'running' },
  waiting: { tone: 'warning', icon: <CirclePauseIcon />, traceStatus: undefined },
  failed: { tone: 'destructive', icon: <XIcon />, traceStatus: 'error' },
}

export function TraceCard() {
  return (
    <SampleCard
      title="Work of the agents"
      description="A line of work in words, with what it wrote."
      className="flex flex-col gap-3"
    >
      <Trace>
        {traceRows.map(({ key, title, description, status, tone }) => {
          const look = looks[status]
          return (
            <TraceCollapsible key={key} defaultOpen={key === 's1'}>
              <TraceCollapsibleTrigger aria-label={`Show what ${title} wrote`}>
                <TraceLine
                  color={tone}
                  {...(look?.traceStatus !== undefined && { status: look.traceStatus })}
                >
                  <TraceIcon>{look?.icon}</TraceIcon>
                  <TraceTitle>{title}</TraceTitle>
                  <TraceDescription>{description}</TraceDescription>
                </TraceLine>
              </TraceCollapsibleTrigger>
              <TraceCollapsibleContent>
                <Trace>
                  <TraceLine color="neutral">
                    <TraceIcon>
                      <PlusIcon />
                    </TraceIcon>
                    <TraceTitle>AR-001</TraceTitle>
                  </TraceLine>
                  <TraceLine color="neutral">
                    <TraceIcon>
                      <PencilIcon />
                    </TraceIcon>
                    <TraceTitle>PER-001</TraceTitle>
                  </TraceLine>
                </Trace>
              </TraceCollapsibleContent>
            </TraceCollapsible>
          )
        })}
      </Trace>
    </SampleCard>
  )
}
