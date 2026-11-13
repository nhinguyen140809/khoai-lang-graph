/**
 * The colors that Badge, Button, Alert, Code, Highlight, Node, Edge, Marker, Progress, and Spinner
 * take. `chart` is the yellow of the charts, with its own tokens in each theme; `muted` and
 * `accent` are the gray and the blue tint of the themes.
 */
export const tones = [
  'neutral',
  'primary',
  'success',
  'warning',
  'destructive',
  'chart',
  'muted',
  'accent',
] as const

export type Tone = (typeof tones)[number]

/** The tones that read as a state: they answer "how it went", never "which one it is". */
export const statusTones = ['success', 'warning', 'destructive'] as const satisfies readonly Tone[]

/**
 * The tones that carry no state: they tell one thing from another, and never say how it is. The
 * list is also the order in which the places of a list take them in turn, the color of the app
 * first.
 */
export const nonStatusTones = [
  'primary',
  'chart',
  'accent',
  'muted',
  'neutral',
] as const satisfies readonly Tone[]

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

/**
 * The fills of Badge and Button, from the strongest to the weakest. `text` is the weakest: words
 * with no fill or border in any state, which only change color on hover or when pressed.
 */
export const fills = ['solid', 'soft', 'outline', 'ghost', 'link', 'text'] as const

export type Fill = (typeof fills)[number]
