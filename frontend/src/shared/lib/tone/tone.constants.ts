import type { Fill, Tone, ToneVariants } from './tone.types'

/**
 * The classes that a `color` prop adds. Each color sets five CSS variables that the variant
 * classes of the components read:
 *
 * - `--tone`: solid fill
 * - `--tone-foreground`: text on the solid fill
 * - `--tone-strong`: text, icons, and bars on the page and on the soft fill
 * - `--tone-soft`: soft fill, the color at an opacity that keeps `--tone-strong` at 4.5:1 or more
 *   (warning in the light theme: 4.0:1, and chart 4.2:1, see styles.css)
 * - `--tone-border`: outline
 */
export const toneClasses = {
  neutral:
    '[--tone:var(--secondary)] [--tone-foreground:var(--secondary-foreground)] [--tone-strong:var(--foreground)] [--tone-soft:color-mix(in_oklab,var(--foreground)_8%,transparent)] [--tone-border:var(--border)] dark:[--tone-soft:color-mix(in_oklab,var(--foreground)_10%,transparent)]',
  primary:
    '[--tone:var(--primary)] [--tone-foreground:var(--primary-foreground)] [--tone-strong:var(--primary)] [--tone-soft:color-mix(in_oklab,var(--primary)_10%,transparent)] [--tone-border:color-mix(in_oklab,var(--primary)_50%,transparent)] dark:[--tone-soft:color-mix(in_oklab,var(--primary)_16%,transparent)]',
  success:
    '[--tone:var(--success)] [--tone-foreground:var(--success-foreground)] [--tone-strong:var(--success-strong)] [--tone-soft:color-mix(in_oklab,var(--success)_15%,transparent)] [--tone-border:color-mix(in_oklab,var(--success-strong)_50%,transparent)] dark:[--tone-soft:color-mix(in_oklab,var(--success)_20%,transparent)]',
  // The orange is light, so its soft fill needs more opacity to stand out as much as the others.
  warning:
    '[--tone:var(--warning)] [--tone-foreground:var(--warning-foreground)] [--tone-strong:var(--warning-strong)] [--tone-soft:color-mix(in_oklab,var(--warning)_35%,transparent)] [--tone-border:color-mix(in_oklab,var(--warning-strong)_50%,transparent)] dark:[--tone-soft:color-mix(in_oklab,var(--warning)_20%,transparent)]',
  destructive:
    '[--tone:var(--destructive)] [--tone-foreground:var(--destructive-foreground)] [--tone-strong:var(--destructive-strong)] [--tone-soft:color-mix(in_oklab,var(--destructive)_15%,transparent)] [--tone-border:color-mix(in_oklab,var(--destructive-strong)_50%,transparent)] dark:[--tone-soft:color-mix(in_oklab,var(--destructive)_20%,transparent)]',
  // The yellow of the charts as a color of the interface, its own tokens in each theme: the
  // vivid yellow fills, the light theme reads it as the dark amber --chart-strong, as the light
  // warning below reads its orange, and the dark theme as the most contrast yellow of the ramp.
  // The yellow is light, so its soft fill needs the same opacity as the warning's.
  chart:
    '[--tone:var(--chart)] [--tone-foreground:var(--chart-foreground)] [--tone-strong:var(--chart-strong)] [--tone-soft:color-mix(in_oklab,var(--chart)_35%,transparent)] [--tone-border:color-mix(in_oklab,var(--chart-strong)_50%,transparent)] dark:[--tone-soft:color-mix(in_oklab,var(--chart)_20%,transparent)]',
} as const satisfies Record<Tone, string>

// Badge and Button read their props the same way. Without a color, solid and link take the
// primary color and the others stay neutral.
export const fillTones = {
  defaultVariant: 'solid',
  legacy: {
    default: { variant: 'solid', color: 'primary' },
    secondary: { variant: 'solid', color: 'neutral' },
    destructive: { variant: 'soft', color: 'destructive' },
  },
  defaultColors: {
    solid: 'primary',
    soft: 'neutral',
    outline: 'neutral',
    ghost: 'neutral',
    link: 'primary',
  },
} as const satisfies ToneVariants<Fill, string>
