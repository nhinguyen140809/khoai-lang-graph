'use client'

import { cn } from 'cn'
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { Toaster as Sonner, type ToasterProps } from 'sonner'

import { toneClasses } from '@/shared/lib/tone'

/**
 * How long a toast with an action, such as Undo, stays, in milliseconds: longer than the 4 seconds
 * of a toast without one, so that there is time to reach the action, also from the keyboard.
 */
const actionToastDuration = 10_000

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as NonNullable<ToasterProps['theme']>}
      className="toaster group"
      // Each icon takes the text color of its status; the toast itself stays neutral.
      icons={{
        success: <CircleCheckIcon className="size-4 text-success-strong" />,
        info: <InfoIcon className="size-4 text-primary" />,
        warning: <TriangleAlertIcon className="size-4 text-warning-strong" />,
        error: <OctagonXIcon className="size-4 text-destructive-strong" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--border-radius': 'var(--radius)',
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: 'cn-toast',
          // An action, such as Undo, is a small ghost button in the primary color rather than the
          // solid button of the library, whose styles the important classes override.
          actionButton: cn(
            toneClasses.primary,
            'h-7! rounded-md! bg-transparent! px-2.5! text-[0.8rem]! text-(--tone-strong)! hover:bg-(--tone-soft)!',
          ),
        },
      }}
      {...props}
    />
  )
}

export { actionToastDuration, Toaster }
