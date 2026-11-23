/** How each size of the prompt shows: the rows of its box, its smallest height, the corner of its
 * box (the more it holds, the rounder, as in the Nova style), and where its send addon sits, with
 * the look of that addon; and the padding of its text, of its files and of the row under it, so that the row lines up with what is inside the box. The padding grows with the size as
 * the padding of the other components does (none where the group's own is enough) */
export const promptInputLooks = {
  comfortable: {
    rows: 3,
    minHeight: 'min-h-16',
    corner: 'rounded-xl',
    addon: 'block-end',
    addonLook: 'justify-between gap-2 px-4 pb-3',
    textPadding: 'px-4 py-3',
    trayPadding: 'px-4 pt-3',
    footerPadding: 'px-4',
  },
  compact: {
    rows: 1,
    minHeight: 'min-h-9',
    corner: 'rounded-lg',
    addon: 'block-end',
    addonLook: 'justify-between gap-2',
    textPadding: '',
    trayPadding: '',
    footerPadding: '',
  },
  slim: {
    rows: 1,
    minHeight: 'min-h-9',
    corner: 'rounded-lg',
    addon: 'inline-end',
    addonLook: 'justify-end',
    textPadding: '',
    trayPadding: '',
    footerPadding: '',
  },
} as const satisfies Record<
  string,
  {
    rows: number
    minHeight: string
    corner: string
    addon: string
    addonLook: string
    textPadding: string
    trayPadding: string
    footerPadding: string
  }
>

/** The sizes of the prompt input: how many rows its box has and where its send sits. */
export type PromptInputSize = keyof typeof promptInputLooks
