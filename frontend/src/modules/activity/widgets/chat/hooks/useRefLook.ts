'use client'

import { useItem, useItemSchema } from '@/modules/artifact/entities'
import {
  hasItemBlocks,
  iconOf,
  itemTitle,
  kindSchemasByKind,
  useArtifactKinds,
} from '@/modules/workflow/entities'

import { activityChatMessages } from '../activity-chat.constants'
import type { Reference, RefLook } from '../ref-links.types'

/**
 * The look of a reference: a document reads from the message, an item from the item itself.
 *
 * The drawing is the one the grid of the documents uses — a folder or a page, the icon of its kind,
 * and the text its color comes from — so the card of the chat and the card of Documents are the same
 * picture of the same kind, and a change in that grid shows here without a second edit.
 */
export function useRefLook(reference: Reference): RefLook {
  const { data: kinds } = useArtifactKinds()
  const isItem = reference.type === 'item'
  const item = useItem(isItem ? reference.id : '', isItem ? reference.version : undefined, {
    isEnabled: isItem,
  })
  const { schema: itemSchema } = useItemSchema(isItem ? item.data : undefined)

  if (reference.type === 'artifact') {
    const schema = kindSchemasByKind(kinds).get(reference.kind)?.schema
    const isFolder = hasItemBlocks(kinds, reference.kind)
    return {
      label: `${reference.title}, ${activityChatMessages.version(reference.version)}`,
      title: reference.title,
      description: activityChatMessages.version(reference.version),
      version: reference.version,
      look: isFolder ? 'folder' : 'text',
      icon: schema === undefined ? null : iconOf(schema),
      seed: isFolder ? reference.title : reference.kind,
    }
  }
  return {
    label: activityChatMessages.quickLook(reference.key),
    version: reference.version,
    title: item.data === undefined ? reference.key : itemTitle(itemSchema, item.data),
    description:
      itemSchema === undefined
        ? activityChatMessages.version(reference.version)
        : activityChatMessages.itemMeta(itemSchema.title, reference.key, reference.version),
    look: 'text',
    icon: itemSchema === undefined ? null : iconOf(itemSchema),
    seed: itemSchema?.title ?? reference.key,
  }
}
