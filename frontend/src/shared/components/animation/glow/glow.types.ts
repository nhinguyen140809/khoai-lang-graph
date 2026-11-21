/** The outline of a glow: round, wider than tall, a long soft streak, or an uneven rounded blob. */
export type GlowShape = 'circle' | 'ellipse' | 'streak' | 'blob'

/** How large a glow is, within its shape. */
export type GlowSize = 'sm' | 'md' | 'lg' | 'xl'

/** How soft the edge of a glow is, from a little blurred to as soft as a very large glow needs. */
export type GlowBlur = 'sm' | 'md' | 'lg' | 'xl'

/** How a glow comes in: it fades in, grows from a smaller size while it fades in, or is just there. */
export type GlowEntrance = 'fade' | 'grow' | 'none'

/** How a glow moves once it is there: it drifts over a corner, breathes, or stands still. */
export type GlowMotion = 'drift' | 'pulse' | 'none'
