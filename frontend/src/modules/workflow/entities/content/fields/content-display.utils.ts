import { isOneOf } from '@/shared/lib/guards'

import type { ArtifactKinds, ContentSchema } from '../../artifact-kinds/artifact-kinds.types'
import {
  type ArtifactDisplay,
  artifactDisplays,
  type ContentDisplay,
  type ItemDisplay,
  itemDisplays,
  type ItemPageLayout,
  itemPageLayouts,
} from './content-fields.types'

/** The layout that an artifact kind names for its document, else `document`. */
export function artifactDisplayOf(schema: ContentSchema): ArtifactDisplay {
  const named = schema['x-ui-display']
  return isOneOf(artifactDisplays, named) ? named : 'document'
}

/** The display an item kind names, else `table`. */
function itemDisplayOf(schema: ContentSchema): ItemDisplay {
  const named = schema['x-ui-display']
  return isOneOf(itemDisplays, named) ? named : 'table'
}

/** How a kind is shown: for an artifact, its layout; for an item, the display it names, else `table`. */
export function contentDisplayOf(schema: ContentSchema): ContentDisplay {
  return schema['x-level'] === 'artifact' ? artifactDisplayOf(schema) : itemDisplayOf(schema)
}

/** The layout of the page of one item of the kind: the row of its display in `itemPageLayouts`. */
export function pageLayoutOf(schema: ContentSchema): ItemPageLayout {
  return itemPageLayouts[itemDisplayOf(schema)]
}

/**
 * What each kind of artifact is made of, by kind name: the layout of its own schema when it names
 * one, else the display of the first kind of item that holds content, since a section only gives
 * the structure; `heading` for a kind that holds sections alone, and `document` for a kind that
 * holds no item.
 */
export function documentDisplaysByKind(
  kinds: ArtifactKinds | undefined,
): Map<string, ContentDisplay> {
  return new Map(
    (kinds?.artifact_kinds ?? []).map(({ kind, schema, item_kinds }): [string, ContentDisplay] => {
      const layout = artifactDisplayOf(schema)
      if (layout !== 'document') return [kind, layout]
      const displays = item_kinds.map(({ schema: itemSchema }) => contentDisplayOf(itemSchema))
      const content = displays.find((display) => display !== 'heading')
      return [kind, content ?? displays[0] ?? 'document']
    }),
  )
}
