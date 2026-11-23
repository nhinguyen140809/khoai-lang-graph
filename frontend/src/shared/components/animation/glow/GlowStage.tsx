import { cn } from 'cn'
import type { ComponentProps } from 'react'

import { GlowBackdrop } from './GlowBackdrop'

interface GlowStageProps extends ComponentProps<'div'> {
  /** The element: a landmark, such as `main`, when the page is one. */
  as?: 'div' | 'main' | 'section'
  arrangement?: ComponentProps<typeof GlowBackdrop>['arrangement']
  /** The classes of the backdrop, such as a height to keep the glows at the top of a page that scrolls. */
  backdropClassName?: string
}

/**
 * A page with a `GlowBackdrop` behind its content, and everything that the backdrop needs of the
 * page that holds it: it stacks the glows behind what it shows, clips what goes past its edge, and
 * has a background of its own for the grain to blend with. Give its layout with the class.
 */
export function GlowStage({
  as: Element = 'div',
  arrangement,
  backdropClassName,
  className,
  children,
  ...props
}: GlowStageProps) {
  return (
    <Element className={cn('relative isolate overflow-hidden bg-background', className)} {...props}>
      <GlowBackdrop
        {...(arrangement !== undefined && { arrangement })}
        {...(backdropClassName !== undefined && { className: backdropClassName })}
      />
      {children}
    </Element>
  )
}
