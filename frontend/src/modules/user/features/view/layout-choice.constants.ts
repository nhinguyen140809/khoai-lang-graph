import { type View, views } from '@/shared/lib/view'

import type { LayoutOption } from './layout-choice.types'
import { sketches } from './LayoutSketches'
import { viewLabels } from './view.constants'

// The words and the pictures of the choice of the layout, in the settings.

export const layoutChoiceMessages = {
  title: 'Layout',
  /** What the choice changes. */
  hint: 'It sets the layout of the whole app, and opens it.',
  /** The mark on the layout in use. */
  current: 'Current layout',
}

/** What each view offers in its card; a new view needs an entry, which the type requires. */
const layouts: Record<View, Omit<LayoutOption, 'view'>> = {
  user: {
    title: viewLabels.user,
    description:
      'Describe your idea in a chat and receive the documents written for you. Made for those who want the result without reviewing each document.',
    arrangement: 'single',
    figures: [{ label: 'Chat', sketch: sketches.chat }],
  },
  developer: {
    title: viewLabels.developer,
    description:
      'Read the documents closely and follow the evidence that links them. Made for those who review each document thoroughly.',
    arrangement: 'stack',
    figures: [
      { label: 'Activity', sketch: sketches.activity },
      { label: 'Documents', sketch: sketches.document },
      { label: 'Trace', sketch: sketches.trace },
    ],
  },
}

/** The layouts to choose from, in the order of `views`: the card at the left comes first. */
export const layoutOptions: readonly LayoutOption[] = views.map((view) => ({
  view,
  ...layouts[view],
}))
