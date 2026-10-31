import { cva } from 'class-variance-authority'
import { cn } from 'cn'
import { Slot } from 'radix-ui'
import * as React from 'react'

import { rangesOfQuery, splitByRanges, type TextRange } from '@/shared/lib/text'
import { type Tone, toneClasses } from '@/shared/lib/tone'

// `variant` is how the words are marked and `color` the meaning; the color sets the --tone
// variables these read. The words keep their own color, except in `solid`. Hover, focus and an
// open popup (`data-state=open`) paint the soft fill under the words and hide the line, so a line
// mark becomes the fill it stands for.
const highlightStyles = cva(
  '-mx-[0.2em] rounded-[0.25em] bg-transparent box-decoration-clone px-[0.2em] py-[0.12em] text-inherit transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 data-interactive:cursor-pointer',
  {
    variants: {
      variant: {
        underline:
          'underline [text-decoration-color:var(--tone-strong)] decoration-2 underline-offset-[0.2em] hover:bg-(--tone-soft) hover:[text-decoration-color:transparent] focus-visible:bg-(--tone-soft) focus-visible:[text-decoration-color:transparent] data-[state=open]:bg-(--tone-soft) data-[state=open]:[text-decoration-color:transparent]',
        wavy: 'underline [text-decoration-color:var(--tone-strong)] decoration-wavy decoration-1 underline-offset-[0.2em] hover:bg-(--tone-soft) hover:[text-decoration-color:transparent] focus-visible:bg-(--tone-soft) focus-visible:[text-decoration-color:transparent] data-[state=open]:bg-(--tone-soft) data-[state=open]:[text-decoration-color:transparent]',
        soft: 'bg-(--tone-soft) hover:bg-[color-mix(in_oklab,var(--tone)_32%,transparent)] focus-visible:bg-[color-mix(in_oklab,var(--tone)_32%,transparent)] data-[state=open]:bg-[color-mix(in_oklab,var(--tone)_32%,transparent)]',
        solid:
          'bg-(--tone) text-(--tone-foreground) hover:bg-(--tone)/80 data-[state=open]:bg-(--tone)/80',
      },
      color: toneClasses,
    },
  },
)

/** How the words are marked: a line under them (`underline`, `wavy`) or a background (`soft`, `solid`). */
type HighlightVariant = 'underline' | 'wavy' | 'soft' | 'solid'

type HighlightMarkProps = Omit<React.ComponentProps<'mark'>, 'color'> & {
  variant?: HighlightVariant | undefined
  color?: Tone | undefined
  /** The mark acts on a click or a key: it takes the focus, shows a pointer, and answers Enter and Space. */
  isInteractive?: boolean | undefined
  asChild?: boolean
}

/** Some words marked as a part of a text. */
function HighlightMark({
  className,
  variant = 'underline',
  color = 'primary',
  isInteractive = false,
  asChild = false,
  onKeyDown,
  ...props
}: HighlightMarkProps) {
  const Comp = asChild ? Slot.Root : 'mark'

  return (
    <Comp
      data-slot="highlight-mark"
      data-variant={variant}
      data-color={color}
      data-interactive={isInteractive ? '' : undefined}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      className={cn(highlightStyles({ variant, color }), className)}
      onKeyDown={(event: React.KeyboardEvent<HTMLElement>) => {
        onKeyDown?.(event)
        if (!isInteractive || event.defaultPrevented) return
        if (event.key !== 'Enter' && event.key !== ' ') return
        event.preventDefault()
        event.currentTarget.click()
      }}
      {...props}
    />
  )
}

/** A range of the text to mark; the fill and the color of the range win over those of the text. */
interface HighlightRange extends TextRange {
  variant?: HighlightVariant | undefined
  color?: Tone | undefined
}

type HighlightProps<Range extends HighlightRange> = Omit<
  React.ComponentProps<'span'>,
  'children' | 'color'
> & {
  /** The text. */
  children: string
  /** The words to mark, in any case and accent unless `ignoreCase` is false; `ranges` wins over it. */
  query?: string | readonly string[] | undefined
  /** What to mark, as ranges of the text; each range may carry more fields for `renderMark`. */
  ranges?: readonly Range[] | undefined
  variant?: HighlightVariant | undefined
  color?: Tone | undefined
  /** Whether case and accents are left out when matching `query`; true when absent. */
  ignoreCase?: boolean | undefined
  /** Whether every place of `query` is marked, or only the first; true when absent. */
  matchAll?: boolean | undefined
  /**
   * Wraps the mark of a range, for example in the trigger of a popover; the marks become
   * interactive. A mark found by `query` is given a range of its own.
   */
  renderMark?:
    ((mark: React.ReactElement<HighlightMarkProps>, range: Range) => React.ReactNode) | undefined
}

/**
 * A text with some of its words marked: the places of a `query`, or the `ranges` that are given.
 * Ranges may carry their own fill and color, so one text can mark several meanings.
 */
function Highlight<Range extends HighlightRange = HighlightRange>({
  children,
  query,
  ranges,
  variant,
  color,
  ignoreCase,
  matchAll,
  renderMark,
  ...props
}: HighlightProps<Range>) {
  const marked =
    ranges ??
    (query === undefined
      ? []
      : (rangesOfQuery(children, query, { ignoreCase, matchAll }) as unknown as Range[]))

  return (
    <span data-slot="highlight" {...props}>
      {splitByRanges(children, marked).map(({ text, range }) => {
        if (range === null) return text
        const mark = (
          <HighlightMark
            variant={range.variant ?? variant}
            color={range.color ?? color}
            isInteractive={renderMark !== undefined}
          >
            {text}
          </HighlightMark>
        )
        return (
          <React.Fragment key={range.start}>
            {renderMark === undefined ? mark : renderMark(mark, range)}
          </React.Fragment>
        )
      })}
    </span>
  )
}

export { Highlight, HighlightMark, type HighlightVariant }
