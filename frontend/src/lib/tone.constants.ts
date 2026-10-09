/** The colors that Badge, Button, Alert, Node, Edge, Marker, Progress, and Spinner take. */
export const tones = ['neutral', 'primary', 'success', 'warning', 'destructive'] as const

export type Tone = (typeof tones)[number]

/**
 * The classes that a `color` prop adds. Each color sets five CSS variables that the variant
 * classes of the components read:
 *
 * - `--tone`: solid fill
 * - `--tone-foreground`: text on the solid fill
 * - `--tone-strong`: text, icons, and bars on the page and on the soft fill
 * - `--tone-soft`: soft fill, the color at an opacity that keeps `--tone-strong` at 4.5:1 or more
 *   (warning in the light theme: 4.0:1, see styles.css)
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
} as const satisfies Record<Tone, string>

/**
 * How a component reads its `variant` (the fill) and `color` props. `legacy` maps each variant
 * name of shadcn/ui to a fill and a color, so that examples from its documentation keep working.
 * `defaultColors` gives the color of each fill when no color is set.
 */
export interface ToneVariants<Variant extends string, Legacy extends string> {
  defaultVariant: NoInfer<Variant>
  legacy: Record<Legacy, { variant: NoInfer<Variant>; color: Tone }>
  defaultColors: Record<Variant, Tone>
}

/** The `variant` and `color` props of a component that reads them through `ToneVariants`. */
export interface ToneVariantProps<Config extends ToneVariants<string, string>> {
  variant?: Extract<keyof Config['defaultColors'] | keyof Config['legacy'], string> | undefined
  color?: Tone | undefined
}

/** The fills of Badge and Button, from the strongest to the weakest. */
export const fills = ['solid', 'soft', 'outline', 'ghost', 'link'] as const

export type Fill = (typeof fills)[number]

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
