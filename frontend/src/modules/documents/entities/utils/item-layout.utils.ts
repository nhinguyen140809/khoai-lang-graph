import type { ArtifactItem } from '@/modules/artifact/entities/@x/documents'
import {
  type ContentField,
  type ContentSchema,
  type ContentSection,
  type ItemPageLayout,
  pageLayoutOf,
  profileFields,
  shownFields,
} from '@/modules/workflow/entities/@x/documents'
import { isEmpty } from '@/shared/lib/guards'

import type { ItemLayoutView, ItemPageView } from '../types/item-layout.types'

// What each page layout of an item decides, in one place: a profile leads its title with an avatar
// and sets some of its fields on the key line; any other page draws every field in its body.
const itemLayoutViews = {
  fields: {
    hasAvatar: false,
    keyLineFields: () => [],
    // Read when it is called, not when this module loads: the modules that it imports may still be loading.
    bodyFields: (schema) => shownFields(schema),
    sections: () => [],
  },
  profile: {
    hasAvatar: true,
    keyLineFields: (schema) => profileFields(schema).line,
    bodyFields: (schema) => profileFields(schema).body,
    sections: (schema) => profileFields(schema).sections,
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
    sections: view.sections(schema),
  }
}

/** The fields that the item has a value for, in their order. */
export function filledFields(item: ArtifactItem, fields: readonly ContentField[]): ContentField[] {
  return fields.filter((field) => !isEmpty(item.content[field.name]))
}

/** The blocks of the page of an item, each with only the fields that the item has a value for; a block left with none is dropped. */
export function filledSections(
  item: ArtifactItem,
  sections: readonly ContentSection[],
): ContentSection[] {
  return sections
    .map((section) => ({ ...section, fields: filledFields(item, section.fields) }))
    .filter((section) => section.fields.length > 0)
}
