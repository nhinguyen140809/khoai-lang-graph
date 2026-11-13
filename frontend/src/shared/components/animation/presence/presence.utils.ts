import { cva } from 'class-variance-authority'

/** Content that appears from a side of its box and goes back to it, or that fades or zooms. */
export const presenceVariants = cva(
  'fill-mode-forwards data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 motion-reduce:animate-none motion-reduce:data-[state=closed]:hidden',
  {
    variants: {
      variant: {
        fade: '',
        scale: 'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        top: 'data-[state=closed]:slide-out-to-top-4 data-[state=open]:slide-in-from-top-4',
        bottom:
          'data-[state=closed]:slide-out-to-bottom-4 data-[state=open]:slide-in-from-bottom-4',
        left: 'data-[state=closed]:slide-out-to-left-4 data-[state=open]:slide-in-from-left-4',
        right: 'data-[state=closed]:slide-out-to-right-4 data-[state=open]:slide-in-from-right-4',
      },
    },
    defaultVariants: { variant: 'fade' },
  },
)
