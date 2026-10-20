'use client'

import { cn } from 'cn'
import { TriangleAlertIcon } from 'lucide-react'
import * as React from 'react'

import { toneClasses } from '@/shared/lib/tone'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './alert-dialog'
import { Spinner } from './spinner'

interface ConfirmDialogProps {
  /** The control that opens the dialog. Leave it out to open the dialog with `open` instead. */
  trigger?: React.ReactNode
  /**
   * Whether the dialog is open, for a dialog opened from elsewhere, such as an item of a menu,
   * which cannot hold the dialog. Without it the dialog keeps this state itself.
   */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Runs once the dialog has closed, after its animation. */
  onClosed?: (() => void) | undefined
  /** A question that names the action, such as "Sign out?". */
  title: React.ReactNode
  /** What the action does, and whether it can be undone. */
  description?: React.ReactNode
  /**
   * An icon over the title, beside it on a wide screen, such as the icon of the action in a menu.
   * Without one, an action that is destructive shows a warning sign; `null` shows none.
   */
  icon?: React.ReactNode
  /** The words of the button that confirms: the action itself, such as "Sign out", not "OK". */
  confirmLabel: React.ReactNode
  cancelLabel?: React.ReactNode
  /** An action that deletes or cannot be undone: the button that confirms is red. */
  destructive?: boolean
  size?: 'default' | 'sm'
  /**
   * Runs the action. When it returns a promise, the dialog waits for it with its buttons disabled,
   * then closes when it resolves; it stays open when it rejects, so the caller can say why.
   */
  onConfirm: () => unknown
  /** More content under the description, such as the list of what the action changes. */
  children?: React.ReactNode
}

/**
 * Asks before an action, on the alert dialog: the focus starts on the button that cancels, and
 * Escape cancels, except while the action runs.
 */
function ConfirmDialog({
  trigger,
  open,
  onOpenChange,
  onClosed,
  title,
  description,
  icon,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive = false,
  size = 'default',
  onConfirm,
  children,
}: ConfirmDialogProps) {
  const [ownOpen, setOwnOpen] = React.useState(false)
  const shownIcon = icon === undefined && destructive ? <TriangleAlertIcon /> : icon
  const [pending, setPending] = React.useState(false)

  const changeOpen = (next: boolean) => {
    if (open === undefined) setOwnOpen(next)
    onOpenChange?.(next)
  }

  const confirm = (event: React.MouseEvent<HTMLButtonElement>) => {
    // The dialog closes when the action is done, not on the click.
    event.preventDefault()
    const result = onConfirm()
    if (!(result instanceof Promise)) {
      changeOpen(false)
      return
    }
    setPending(true)
    result.then(
      () => {
        setPending(false)
        changeOpen(false)
      },
      () => {
        setPending(false)
      },
    )
  }

  return (
    <AlertDialog
      open={open ?? ownOpen}
      onOpenChange={(next) => {
        if (!pending) changeOpen(next)
      }}
    >
      {trigger !== undefined && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
      <AlertDialogContent
        size={size}
        onCloseAutoFocus={() => onClosed?.()}
        // Without a description, the dialog is named by its title alone.
        {...(description === undefined && { 'aria-describedby': undefined })}
      >
        <AlertDialogHeader>
          {shownIcon !== undefined && shownIcon !== null && (
            // The icon takes the color of the action without a fill, which would hardly stand
            // out from the dialog.
            <AlertDialogMedia
              aria-hidden
              className={cn(
                'bg-transparent',
                destructive ? [toneClasses.destructive, 'text-(--tone-strong)'] : 'text-primary',
              )}
            >
              {shownIcon}
            </AlertDialogMedia>
          )}
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description !== undefined && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        {children}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            {...(destructive && { variant: 'solid', color: 'destructive' })}
            disabled={pending}
            onClick={confirm}
          >
            {pending && <Spinner />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export { ConfirmDialog }
