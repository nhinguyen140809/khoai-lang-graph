'use client'

import { cn } from 'cn'

import { Button } from '@/shared/components/ui/button'
import { Code } from '@/shared/components/ui/code'
import {
  type FloatingPlacement,
  type FloatingSize,
  FloatingSurface,
  type FloatingVariant,
} from '@/shared/components/ui/floating-surface'

import { SampleCard, SampleGroup } from '../Sample'

const corners = [
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
] as const satisfies readonly FloatingPlacement[]

const variants = ['default', 'popover', 'glass'] as const satisfies readonly FloatingVariant[]

const sizes = ['sm', 'default', 'lg'] as const satisfies FloatingSize[]

// The words a surface floats over, so the glass of the surface has something to blur.
const sampleText =
  'The analysis lists the requirements that the interviews produced, with the evidence behind each one.'

/** A positioned area that holds text, which a surface floats at a corner of. */
function FloatingArea({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('relative h-28 overflow-hidden rounded-md border bg-muted/30', className)}>
      <p className="p-3 text-sm text-muted-foreground">{sampleText}</p>
      {children}
    </div>
  )
}

export function FloatingSurfaceCard() {
  return (
    <SampleCard
      title="Floating surface"
      description={
        <>
          A <Code>Surface</Code> that floats at a corner of the area that contains it, above its
          content; the area needs <Code>relative</Code>. <Code>corner</Code>, <Code>offset</Code>,{' '}
          <Code>variant</Code> and <Code>size</Code> shape it, and <Code>className</Code> changes
          the rest, such as the z-index.
        </>
      }
      className="flex flex-col gap-4"
    >
      <SampleGroup label="corners">
        <FloatingArea>
          {corners.map((corner) => (
            <FloatingSurface key={corner} placement={corner} size="sm" variant="popover">
              {corner}
            </FloatingSurface>
          ))}
        </FloatingArea>
      </SampleGroup>
      <SampleGroup label="variants">
        <div className="grid grid-cols-3 gap-2">
          {variants.map((variant) => (
            <FloatingArea key={variant}>
              <FloatingSurface placement="bottom-right" size="sm" variant={variant}>
                {variant}
              </FloatingSurface>
            </FloatingArea>
          ))}
        </div>
      </SampleGroup>
      <SampleGroup label="sizes">
        <div className="grid grid-cols-3 gap-2">
          {sizes.map((size) => (
            <FloatingArea key={size}>
              <FloatingSurface placement="bottom-right" size={size}>
                <Button size="sm" variant="ghost">
                  Copy
                </Button>
              </FloatingSurface>
            </FloatingArea>
          ))}
        </div>
      </SampleGroup>
    </SampleCard>
  )
}
