import {
  CircleAlertIcon,
  CircleCheckIcon,
  InfoIcon,
  type LucideIcon,
  SquareChevronRightIcon,
  TriangleAlertIcon,
} from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert'
import type { Tone } from '@/shared/lib/tone.constants'

import { SampleCard, SampleGroup } from '../Sample'

const variants = ['outline', 'soft', 'solid'] as const

const messages: { color: Tone; Icon: LucideIcon; title: string }[] = [
  {
    color: 'neutral',
    Icon: SquareChevronRightIcon,
    title: 'Message queued, read at the next step',
  },
  { color: 'primary', Icon: InfoIcon, title: 'The run paused at checkpoint_analysis' },
  { color: 'success', Icon: CircleCheckIcon, title: 'Specification v2 approved' },
  { color: 'warning', Icon: TriangleAlertIcon, title: 'US-004 was made from REQ-001 v2' },
  { color: 'destructive', Icon: CircleAlertIcon, title: 'Run 2 failed: cost limit reached' },
]

export function AlertsCard() {
  return (
    <SampleCard
      title="Alerts"
      description="Outline, soft, and solid, in every color."
      className="flex flex-col gap-3"
    >
      {variants.map((variant) => (
        <SampleGroup key={variant} label={variant}>
          {messages.map(({ color, Icon, title }) => (
            <Alert key={color} variant={variant} color={color}>
              <Icon />
              <AlertTitle>{title}</AlertTitle>
              {color === 'warning' && (
                <AlertDescription>Review it against the new version.</AlertDescription>
              )}
            </Alert>
          ))}
        </SampleGroup>
      ))}
    </SampleCard>
  )
}
