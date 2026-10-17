import type * as React from 'react'

import { Button } from './button'
import { Spinner } from './spinner'

interface PendingButtonProps extends Omit<React.ComponentProps<typeof Button>, 'asChild'> {
  /** The action of the button runs: the button is disabled and shows a spinner before its words. */
  pending: boolean
  /** What runs, for the spinner, such as "Signing in". */
  pendingLabel: string
}

/** A button whose action takes a moment, such as the one that submits a form. */
function PendingButton({
  pending,
  pendingLabel,
  disabled,
  children,
  ...props
}: PendingButtonProps) {
  return (
    <Button disabled={pending || disabled} {...props}>
      {pending && <Spinner aria-label={pendingLabel} />}
      {children}
    </Button>
  )
}

export { PendingButton }
