import { cn } from 'cn'

import { typedTextStepMs, typedTextWordMs } from './typed-text.constants'
import { wordsOf } from './typed-text.utils'

interface TypedTextProps {
  text: string
  /** The time between one word starting to come in and the next, in milliseconds. */
  step?: number
  /** How long each word takes to come in, in milliseconds. */
  wordDuration?: number
  /** The time before the first word starts, in milliseconds. */
  delay?: number
  className?: string
}

/**
 * A text that comes in one word after another, each fading in as it grows to its width. In a line
 * that is centered, the words that are there already move aside to make room, so the text stays in
 * the middle while it is typed. Screen readers read the whole text at once, and the words stand
 * still, all shown, when the user asked for less motion.
 */
export function TypedText({
  text,
  step = typedTextStepMs,
  wordDuration = typedTextWordMs,
  delay = 0,
  className,
}: TypedTextProps) {
  const words = wordsOf(text)
  return (
    <span className={cn('inline-flex flex-wrap justify-center', className)}>
      <span className="sr-only">{text}</span>
      {words.map((word, index) => (
        <span
          // The same word can come twice in a text, so the place is part of the key.
          key={`${String(index)}-${word}`}
          aria-hidden
          className="word-cell animate-word-in motion-reduce:animate-none"
          style={{
            animationDuration: `${String(wordDuration)}ms`,
            animationDelay: `${String(delay + index * step)}ms`,
          }}
        >
          {/* The space after a word is part of it, so that it comes in with it; the last has none. */}
          <span
            className={cn(
              'min-w-0 overflow-x-clip whitespace-nowrap',
              index < words.length - 1 && 'pr-1.5',
            )}
          >
            {word}
          </span>
        </span>
      ))}
    </span>
  )
}
