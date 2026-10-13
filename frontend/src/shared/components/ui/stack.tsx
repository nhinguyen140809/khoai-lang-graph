import { cva } from 'class-variance-authority'
import { cn } from 'cn'
import { Slot } from 'radix-ui'
import * as React from 'react'

// The gaps follow the spacing scale of Tailwind, so `gap="2"` is `gap-2`.
const stackVariants = cva('flex', {
  variants: {
    direction: {
      row: 'flex-row',
      column: 'flex-col',
    },
    gap: {
      '0': 'gap-0',
      '0.5': 'gap-0.5',
      '1': 'gap-1',
      '1.5': 'gap-1.5',
      '2': 'gap-2',
      '3': 'gap-3',
      '4': 'gap-4',
      '6': 'gap-6',
      '8': 'gap-8',
    },
    align: {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      baseline: 'items-baseline',
      stretch: 'items-stretch',
    },
    justify: {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
    },
  },
})

type StackDirection = 'row' | 'column'

type StackGap = '0' | '0.5' | '1' | '1.5' | '2' | '3' | '4' | '6' | '8'

/**
 * Lays its children out in a row or a column with an even gap, after the Stack of Chakra UI and
 * MUI. `separator` goes between two children, such as a vertical `Separator` in a row; children
 * that render nothing (`null`, `false`) get none.
 */
function Stack({
  className,
  direction = 'column',
  gap = '2',
  align = direction === 'row' ? 'center' : 'stretch',
  justify,
  separator,
  asChild = false,
  children,
  ...props
}: React.ComponentProps<'div'> & {
  direction?: StackDirection | undefined
  gap?: StackGap | undefined
  align?: 'start' | 'center' | 'end' | 'baseline' | 'stretch' | undefined
  justify?: 'start' | 'center' | 'end' | 'between' | undefined
  separator?: React.ReactNode
  asChild?: boolean
}) {
  const Comp = asChild ? Slot.Root : 'div'
  const items = separator === undefined ? children : withSeparators(children, separator)

  return (
    <Comp
      data-slot="stack"
      data-direction={direction}
      className={cn(stackVariants({ direction, gap, align, justify }), className)}
      {...props}
    >
      {items}
    </Comp>
  )
}

/** The children with `separator` between each two of them. */
function withSeparators(children: React.ReactNode, separator: React.ReactNode) {
  return React.Children.toArray(children).flatMap((child, index) =>
    index === 0
      ? [child]
      : [<React.Fragment key={`separator-${String(index)}`}>{separator}</React.Fragment>, child],
  )
}

export { Stack, type StackDirection, type StackGap }
