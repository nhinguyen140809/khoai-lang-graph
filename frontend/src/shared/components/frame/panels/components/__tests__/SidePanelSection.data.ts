/** The props that open a section or not, and whether it starts open. */
export const openingCases = [
  { name: 'open by default', props: {}, open: true },
  { name: 'open when asked to', props: { defaultOpen: true }, open: true },
  { name: 'collapsed when asked to', props: { defaultOpen: false }, open: false },
]
