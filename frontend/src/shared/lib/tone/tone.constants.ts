import type { Fill, Tone, ToneVariants } from './tone.types'

/**
 * The classes that a `color` prop adds. Each color sets five CSS variables that the variant
 * classes of the components read:
 *
 * - `--tone`: solid fill
 * - `--tone-foreground`: text on the solid fill
 * - `--tone-strong`: text, icons, and bars on the page and on the soft fill
 * - `--tone-soft`: soft fill, the color at an opacity that keeps `--tone-strong` at 4.5:1 or more
 *   (warning in the light theme: 4.0:1, and secondary 4.2:1, see styles.css)
 * - `--tone-border`: outline
 * - `--tone-line`: lines that mark, such as the underline of a highlight and the stroke of an edge. It
 *   is the solid color where that holds 3:1 or more on the page in both themes (primary, success,
 *   destructive), the `-line` token of the color for warning, secondary and accent, whose light
 *   theme needs a color other than `--tone-strong` that still holds 3:1, and `--tone-strong` for the others
 */
export const toneClasses = {
  neutral:
    '[--tone:color-mix(in_oklab,var(--input)_80%,var(--background))] dark:[--tone:color-mix(in_oklab,var(--muted)_60%,var(--background))] [--tone-foreground:var(--foreground)] [--tone-strong:var(--foreground)] [--tone-soft:color-mix(in_oklab,var(--foreground)_8%,transparent)] [--tone-border:var(--border)] dark:[--tone-soft:color-mix(in_oklab,var(--foreground)_10%,transparent)] [--tone-line:var(--tone-strong)]',
  primary:
    '[--tone:var(--primary)] [--tone-foreground:var(--primary-foreground)] [--tone-strong:var(--primary)] [--tone-soft:color-mix(in_oklab,var(--primary)_10%,transparent)] [--tone-border:color-mix(in_oklab,var(--primary)_50%,transparent)] dark:[--tone-soft:color-mix(in_oklab,var(--primary)_16%,transparent)] [--tone-line:var(--tone)]',
  success:
    '[--tone:var(--success)] [--tone-foreground:var(--success-foreground)] [--tone-strong:var(--success-strong)] [--tone-soft:color-mix(in_oklab,var(--success)_15%,transparent)] [--tone-border:color-mix(in_oklab,var(--success-strong)_50%,transparent)] dark:[--tone-soft:color-mix(in_oklab,var(--success)_20%,transparent)] [--tone-line:var(--tone)]',
  // The orange is light, so its soft fill needs more opacity to stand out as much as the others.
  warning:
    '[--tone:var(--warning)] [--tone-foreground:var(--warning-foreground)] [--tone-strong:var(--warning-strong)] [--tone-soft:color-mix(in_oklab,var(--warning)_35%,transparent)] [--tone-border:color-mix(in_oklab,var(--warning-strong)_50%,transparent)] dark:[--tone-soft:color-mix(in_oklab,var(--warning)_20%,transparent)] [--tone-line:var(--warning-line)]',
  destructive:
    '[--tone:var(--destructive)] [--tone-foreground:var(--destructive-foreground)] [--tone-strong:var(--destructive-strong)] [--tone-soft:color-mix(in_oklab,var(--destructive)_15%,transparent)] [--tone-border:color-mix(in_oklab,var(--destructive-strong)_50%,transparent)] dark:[--tone-soft:color-mix(in_oklab,var(--destructive)_20%,transparent)] [--tone-line:var(--tone)]',
  // The secondary color of the interface, a yellow with its own tokens in each theme: the vivid
  // yellow fills, the light theme reads it as the dark amber --secondary-strong, as the light
  // warning below reads its orange, and the dark theme as the most contrast yellow of the ramp.
  // The yellow is light, so its soft fill needs the same opacity as the warning's.
  secondary:
    '[--tone:var(--secondary)] [--tone-foreground:var(--secondary-foreground)] [--tone-strong:var(--secondary-strong)] [--tone-soft:color-mix(in_oklab,var(--secondary)_35%,transparent)] [--tone-border:color-mix(in_oklab,var(--secondary-strong)_50%,transparent)] dark:[--tone-soft:color-mix(in_oklab,var(--secondary)_20%,transparent)] [--tone-line:var(--secondary-line)]',
  // The muted fill and its text are a pair of the theme, and the accent is its blue tint; both
  // read as backgrounds, so their soft fill is the token itself.
  muted:
    '[--tone:var(--muted)] [--tone-foreground:var(--muted-foreground)] [--tone-strong:var(--muted-foreground)] [--tone-soft:var(--muted)] [--tone-border:var(--border)] [--tone-line:var(--tone-strong)]',
  accent:
    '[--tone:var(--accent)] [--tone-foreground:var(--accent-foreground)] [--tone-strong:var(--accent-foreground)] [--tone-soft:var(--accent)] [--tone-border:color-mix(in_oklab,var(--accent-line)_50%,transparent)] [--tone-line:var(--accent-line)]',
} as const satisfies Record<Tone, string>

// Badge and Button read their props the same way. Without a color, solid and link take the
// primary color and the others stay neutral.
export const fillTones = {
  defaultVariant: 'solid',
  legacy: {
    default: { variant: 'solid', color: 'primary' },
    secondary: { variant: 'solid', color: 'secondary' },
    destructive: { variant: 'soft', color: 'destructive' },
  },
  defaultColors: {
    solid: 'primary',
    soft: 'neutral',
    outline: 'neutral',
    ghost: 'neutral',
    link: 'primary',
    text: 'neutral',
  },
} as const satisfies ToneVariants<Fill, string>
