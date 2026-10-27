import type { Tone, ToneVariants } from './tone.types'

// `Object.hasOwn` instead of `in`, so that inherited names such as `toString` do not count.
function isLegacyVariant<Legacy extends string>(
  legacy: Record<Legacy, unknown>,
  variant: string,
): variant is Legacy {
  return Object.hasOwn(legacy, variant)
}

/**
 * The fill and the color to render for the `variant` and `color` props of a component. A
 * shadcn/ui variant name maps to a fill and a color; a `color` prop always wins.
 *
 * @example
 * // With fillTones, the config of Badge and Button; each comment is the returned fill and color.
 * resolveToneVariant(fillTones, {}) // solid, primary
 * resolveToneVariant(fillTones, { variant: 'outline' }) // outline, neutral
 * resolveToneVariant(fillTones, { variant: 'destructive' }) // soft, destructive
 * resolveToneVariant(fillTones, { variant: 'secondary', color: 'warning' }) // solid, warning
 */
export function resolveToneVariant<Variant extends string, Legacy extends string>(
  config: ToneVariants<Variant, Legacy>,
  props: { variant?: NoInfer<Variant | Legacy> | undefined; color?: Tone | undefined },
): { variant: Variant; color: Tone } {
  const variant = props.variant ?? config.defaultVariant
  if (isLegacyVariant(config.legacy, variant)) {
    const legacy = config.legacy[variant]
    return { variant: legacy.variant, color: props.color ?? legacy.color }
  }
  return { variant, color: props.color ?? config.defaultColors[variant] }
}
