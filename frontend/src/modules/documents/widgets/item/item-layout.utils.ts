import {
  contentFields,
  type ContentSchema,
  type ItemPageLayout,
  pageLayoutOf,
  profileFields,
} from '@/modules/workflow/entities'

import type { ItemLayoutView, ItemPageView } from './item-layout.types'

// What each page layout of an item decides, in one place: a profile leads its title with an avatar
// and sets some of its fields on the key line; any other page draws every field in its body.
const itemLayoutViews = {
  fields: { hasAvatar: false, keyLineFields: () => [], bodyFields: contentFields },
  profile: {
    hasAvatar: true,
    keyLineFields: (schema) => profileFields(schema).line,
    bodyFields: (schema) => profileFields(schema).body,
  },
} as const satisfies Record<ItemPageLayout, ItemLayoutView>

/** The page layout of the kind of an item and what it decides for the page, from the schema. */
export function itemPageViewOf(schema: ContentSchema): ItemPageView {
  const layout = pageLayoutOf(schema)
  const view = itemLayoutViews[layout]
  return {
    layout,
    hasAvatar: view.hasAvatar,
    keyLineFields: view.keyLineFields(schema),
    bodyFields: view.bodyFields(schema),
  }
}
