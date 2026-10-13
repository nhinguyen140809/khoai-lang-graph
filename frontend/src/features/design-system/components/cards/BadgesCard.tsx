import { Badge } from '@/shared/components/ui/badge'
import { Code } from '@/shared/components/ui/code'
import { fills, tones } from '@/shared/lib/tone.constants'

import { toneIcons } from '../../design-system.constants'
import { SampleCard, SampleGroup } from '../Sample'

export function BadgesCard() {
  return (
    <SampleCard
      title="Badges"
      description={
        <>
          <Code>variant</Code> is the fill, <Code>color</Code> the meaning.
        </>
      }
      className="flex flex-col gap-3"
    >
      {fills.map((variant) => (
        <SampleGroup key={variant} label={variant}>
          <div className="flex flex-wrap gap-1.5">
            {tones.map((color) => {
              const Icon = toneIcons[color]
              return (
                <Badge key={color} variant={variant} color={color}>
                  <Icon data-icon="inline-start" />
                  {color}
                </Badge>
              )
            })}
          </div>
        </SampleGroup>
      ))}
    </SampleCard>
  )
}
