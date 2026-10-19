import { cn } from 'cn'
import { Loader2Icon } from 'lucide-react'

import { type Tone, toneClasses } from '@/shared/lib/tone'

// Without a color the spinner takes the text color around it.
function Spinner({
  className,
  color,
  ...props
}: Omit<React.ComponentProps<'svg'>, 'color'> & { color?: Tone }) {
  return (
    <Loader2Icon
      data-slot="spinner"
      role="status"
      aria-label="Loading"
      data-color={color}
      className={cn(
        'size-4 animate-spin',
        color && [toneClasses[color], 'text-(--tone-strong)'],
        className,
      )}
      {...props}
    />
  )
}

export { Spinner }
