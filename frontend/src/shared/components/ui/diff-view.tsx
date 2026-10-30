import { cva } from 'class-variance-authority'
import { cn } from 'cn'
import * as React from 'react'

import { wordDiff } from '@/shared/lib/diff'
import { toneClasses } from '@/shared/lib/tone'

// The shape of a mark is the one of Highlight - a rounded box around the words, which wraps
// with them across lines - but it holds its own space: a mark sits on the page for good, so its
// fill keeps a small gap from the words outside it, red beside green, instead of reaching over
// them as the marks of Highlight do. The change decides the rest: the removed words read in the
// destructive color and are struck through; the added words read in the success color.
const diffMarkStyles = cva(
  'mx-[0.15em] rounded-[0.25em] bg-(--tone-soft) box-decoration-clone px-[0.2em] py-[0.12em] text-(--tone-strong)',
  {
    variants: {
      change: {
        removed: `${toneClasses.destructive} line-through`,
        added: `${toneClasses.success} no-underline`,
      },
    },
  },
)

/** One stretch of the words that changed, marked in the color of the side that holds it. */
function DiffMark({ change, children }: { change: 'removed' | 'added'; children: string }) {
  const Tag = change === 'removed' ? 'del' : 'ins'

  return (
    <Tag data-slot="diff-mark" data-change={change} className={diffMarkStyles({ change })}>
      {children}
    </Tag>
  )
}

type DiffViewProps = Omit<React.ComponentProps<'div'>, 'children'> & {
  /** The text that was there: its words that the other text does not hold are struck through. */
  before: string
  /** The text that is there now: its words that the other text does not hold are filled. */
  after: string
}

/**
 * One text with the words that changed from another text: the words that only the other text
 * holds are struck through in the destructive color, the words that only this one holds are in
 * the success color, and the rest reads as it was. The words are compared, not the lines, so a
 * change reads where it sits in its sentence; the breaks of the text are kept.
 */
function DiffView({ before, after, className, ...props }: DiffViewProps) {
  const parts = React.useMemo(() => wordDiff(before, after), [before, after])

  return (
    <div data-slot="diff-view" className={cn('whitespace-pre-wrap', className)} {...props}>
      {parts.map(({ text, change }, index) =>
        change === 'same' ? (
          text
        ) : (
          <DiffMark key={index} change={change}>
            {text}
          </DiffMark>
        ),
      )}
    </div>
  )
}

export { DiffView }
