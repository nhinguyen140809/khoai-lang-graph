import { cn } from 'cn'
import type * as React from 'react'

interface KeyTextProps extends Omit<React.ComponentProps<'span'>, 'children'> {
  /** The key, such as REQ-001. */
  children: string
  /**
   * Whether to cut the key with an ellipsis when it does not fit: the whole key then sits in
   * a title, for whoever hovers.
   */
  truncate?: boolean
}

/**
 * The key of a record, as small muted words in the mono font: the title comes first and the
 * key after it, in rows, tables and the words that name an item.
 */
function KeyText({ children, truncate = false, title, className, ...props }: KeyTextProps) {
  return (
    <span
      data-slot="key-text"
      title={title ?? (truncate ? children : undefined)}
      className={cn('font-mono text-xs text-muted-foreground', truncate && 'truncate', className)}
      {...props}
    >
      {children}
    </span>
  )
}

export { KeyText }
