/** How each size of the prompt shows: the rows of its box, its smallest height, the corner of its
 * box (the more it holds, the rounder, as in the Nova style), and where its send addon sits, with
 * the look of that addon. */
export const promptInputLooks = {
  comfortable: {
    rows: 3,
    minHeight: 'min-h-16',
    corner: 'rounded-xl',
    addon: 'block-end',
    addonLook: 'justify-between gap-2',
  },
  compact: {
    rows: 1,
    minHeight: 'min-h-9',
    corner: 'rounded-lg',
    addon: 'block-end',
    addonLook: 'justify-between gap-2',
  },
  slim: {
    rows: 1,
    minHeight: 'min-h-9',
    corner: 'rounded-lg',
    addon: 'inline-end',
    addonLook: 'justify-end',
  },
} as const

/** The sizes of the prompt input: how many rows its box has and where its send sits. */
export type PromptInputSize = keyof typeof promptInputLooks
