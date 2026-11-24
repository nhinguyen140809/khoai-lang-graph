'use client'

import { FileTextIcon, TextIcon } from 'lucide-react'

import { useItem, useItemSchema } from '@/modules/artifact/entities'
import { iconOf, itemTitle, kindSchemasByKind, useArtifactKinds } from '@/modules/workflow/entities'
import { thumbnailIconNamed } from '@/shared/components/thumbnail'

import { activityChatMessages } from '../activity-chat.constants'
import type { Reference, RefLook } from '../ref-links.types'

/**
 * The look of a reference: a document reads from the message, an item from the item itself. The
 * mark is the icon that the kind of the document or item names, as the reader draws it, and a page
 * or a line of text when the kind names none.
 */
export function useRefLook(reference: Reference): RefLook {
  const isItem = reference.type === 'item'
  const item = useItem(isItem ? reference.id : '', isItem ? reference.version : undefined, {
    isEnabled: isItem,
  })
  const { schema } = useItemSchema(isItem ? item.data : undefined)
  const { data: kinds } = useArtifactKinds()

  if (reference.type === 'artifact') {
    const kindSchema = kindSchemasByKind(kinds).get(reference.kind)?.schema
    const version = activityChatMessages.version(reference.version)
    return {
      label: `${reference.title}, ${version}`,
      Mark:
        (kindSchema === undefined ? undefined : thumbnailIconNamed(iconOf(kindSchema))) ??
        FileTextIcon,
      title: reference.title,
      description: version,
    }
  }
  return {
    label: activityChatMessages.quickLook(reference.key),
    Mark: (schema === undefined ? undefined : thumbnailIconNamed(iconOf(schema))) ?? TextIcon,
    title: item.data === undefined ? reference.key : itemTitle(schema, item.data),
    description:
      schema === undefined
        ? activityChatMessages.version(reference.version)
        : activityChatMessages.itemMeta(schema.title, reference.key, reference.version),
  }
}
