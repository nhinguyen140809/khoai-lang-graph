import type { GlowBlur, GlowEntrance, GlowMotion, GlowShape, GlowSize } from './glow.types'

/** The size of a glow by its shape and its size; whole class names, so that they are generated. */
export const glowSizeClasses = {
  circle: { sm: 'size-64', md: 'size-96', lg: 'size-128', xl: 'size-160' },
  ellipse: { sm: 'h-48 w-80', md: 'h-72 w-128', lg: 'h-96 w-160', xl: 'h-128 w-200' },
  streak: { sm: 'h-24 w-96', md: 'h-32 w-144', lg: 'h-40 w-200', xl: 'h-48 w-256' },
  blob: { sm: 'h-56 w-64', md: 'h-80 w-96', lg: 'h-112 w-128', xl: 'h-144 w-160' },
} as const satisfies Record<GlowShape, Record<GlowSize, string>>

/** The blur of a glow by how soft its edge is; whole class names, so that they are generated. */
export const glowBlurClasses = {
  sm: 'blur-xl',
  md: 'blur-2xl',
  lg: 'blur-3xl',
  xl: 'blur-glow',
} as const satisfies Record<GlowBlur, string>

/** The corners of a glow by its shape: the blob is uneven, the others are fully round. */
export const glowCornerClasses = {
  circle: 'rounded-full',
  ellipse: 'rounded-full',
  streak: 'rounded-full',
  blob: 'rounded-blob',
} as const satisfies Record<GlowShape, string>

export const glowEntranceClasses = {
  fade: 'animate-in fade-in-0 fill-mode-backwards motion-reduce:animate-none',
  grow: 'animate-in fade-in-0 zoom-in-75 fill-mode-backwards motion-reduce:animate-none',
  none: '',
} as const satisfies Record<GlowEntrance, string>

export const glowMotionClasses = {
  drift: 'animate-glow-drift motion-reduce:animate-none',
  pulse: 'animate-glow-pulse motion-reduce:animate-none',
  none: '',
} as const satisfies Record<GlowMotion, string>

/** How long a glow takes to come in, in milliseconds. */
export const glowEntranceMs = 1200
