import { ChevronDownIcon, PlayIcon, PlusIcon, SquareIcon, Trash2Icon } from 'lucide-react'

import { fills, tones } from '@/shared/lib/tone.constants'
import { Button } from '@/shared/ui/button'
import { ButtonGroup } from '@/shared/ui/button-group'
import { Code } from '@/shared/ui/code'
import { Spinner } from '@/shared/ui/spinner'

import { toneIcons } from '../../design-system.constants'
import { SampleCard, SampleGroup } from '../Sample'

const shadcnVariants = ['default', 'secondary', 'outline', 'ghost', 'destructive', 'link'] as const

export function ButtonsCard() {
  return (
    <SampleCard
      title="Buttons"
      description={
        <>
          <Code>variant</Code> is the fill, <Code>color</Code> the meaning; sizes, groups, and
          states.
        </>
      }
      className="flex flex-col gap-4"
    >
      {fills.map((variant) => (
        <SampleGroup key={variant} label={variant}>
          <div className="flex flex-wrap gap-1.5">
            {tones.map((color) => {
              const Icon = toneIcons[color]
              return (
                <Button key={color} size="sm" variant={variant} color={color}>
                  <Icon data-icon="inline-start" />
                  {color}
                </Button>
              )
            })}
          </div>
        </SampleGroup>
      ))}
      <SampleGroup label="shadcn/ui names">
        <div className="flex flex-wrap gap-2">
          {shadcnVariants.map((variant) => (
            <Button key={variant} variant={variant}>
              {variant}
            </Button>
          ))}
        </div>
      </SampleGroup>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="xs">Extra small</Button>
        <Button size="sm">Small</Button>
        <Button>Default</Button>
        <Button size="lg">Large</Button>
        <Button size="icon" variant="outline" aria-label="Add item">
          <PlusIcon />
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <ButtonGroup>
          <Button variant="outline">
            <PlayIcon />
            Run
          </Button>
          <Button variant="outline" size="icon" aria-label="Run options">
            <ChevronDownIcon />
          </Button>
        </ButtonGroup>
        <Button disabled>
          <Spinner />
          Running
        </Button>
        <Button variant="solid" color="destructive">
          <SquareIcon />
          Stop run
        </Button>
        <Button variant="ghost" color="destructive" size="icon" aria-label="Delete item">
          <Trash2Icon />
        </Button>
      </div>
    </SampleCard>
  )
}
