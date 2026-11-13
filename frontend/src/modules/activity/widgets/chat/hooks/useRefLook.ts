'use client'

import { FileTextIcon, TextIcon } from 'lucide-react'

import { useItem, useItemSchema } from '@/modules/artifact/entities'
import { itemTitle } from '@/modules/workflow/entities'

import { activityChatMessages } from '../activity-chat.constants'
import type { Reference, RefLook } from '../ref-links.types'

/** The look of a reference: a document reads from the message, an item from the item itself. */
export function useRefLook(reference: Reference): RefLook {
  const isItem = reference.type === 'item'
  const item = useItem(isItem ? reference.id : '', isItem ? reference.version : undefined, {
    isEnabled: isItem,
  })
  const { schema } = useItemSchema(isItem ? item.data : undefined)

  if (reference.type === 'artifact') {
    const version = activityChatMessages.version(reference.version)
    return {
      label: `${reference.title}, ${version}`,
      Mark: FileTextIcon,
      title: reference.title,
      description: version,
    }
  }
  return {
    label: activityChatMessages.quickLook(reference.key),
    Mark: TextIcon,
    title: item.data === undefined ? reference.key : itemTitle(schema, item.data),
    description:
      schema === undefined
        ? activityChatMessages.version(reference.version)
        : activityChatMessages.itemMeta(schema.title, reference.key, reference.version),
  }
}
