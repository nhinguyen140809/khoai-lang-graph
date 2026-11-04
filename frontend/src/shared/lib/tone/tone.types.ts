/** The colors that Badge, Button, Alert, Code, Highlight, Node, Edge, Marker, Progress, and Spinner take. `chart` is the yellow of the charts, with its own tokens in each theme. */
export const tones = ['neutral', 'primary', 'success', 'warning', 'destructive', 'chart'] as const

export type Tone = (typeof tones)[number]

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
