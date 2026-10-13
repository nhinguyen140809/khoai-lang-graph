'use client'

import { AspectRatio } from '@/shared/ui/aspect-ratio'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/shared/ui/carousel'

import { personas } from '../../design-system.fixtures'
import { SampleCard } from '../Sample'

export function CarouselCard() {
  return (
    <SampleCard title="Persona cards" description="Carousel of 16:9 slides." className="px-12">
      <Carousel>
        <CarouselContent>
          {personas.map((persona) => (
            <CarouselItem key={persona.key}>
              <AspectRatio ratio={16 / 9}>
                <div className="flex h-full flex-col justify-end gap-1 rounded-md bg-muted p-3">
                  <span className="font-mono text-xs text-muted-foreground">{persona.key}</span>
                  <span className="text-sm font-medium">{persona.name}</span>
                  <span className="text-xs text-muted-foreground">{persona.summary}</span>
                </div>
              </AspectRatio>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </SampleCard>
  )
}
