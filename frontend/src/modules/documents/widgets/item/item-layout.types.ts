import type { ContentField, ContentSchema, ItemPageLayout } from '@/modules/workflow/entities'

/** What one page layout of an item decides: whether an avatar leads the title, and which fields fill the key line and the body. */
export interface ItemLayoutView {
  hasAvatar: boolean
  keyLineFields: (schema: ContentSchema) => ContentField[]
  bodyFields: (schema: ContentSchema) => ContentField[]
}

/** The page layout of an item with what it decides, worked out once from the schema of its kind. */
export interface ItemPageView {
  layout: ItemPageLayout
  hasAvatar: boolean
  /** The fields that follow the key on the key line. */
  keyLineFields: ContentField[]
  /** The fields that the body of the page draws, filled or not. */
  bodyFields: ContentField[]
}
