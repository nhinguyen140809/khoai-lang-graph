import type { CreateTraceLinkBody } from '@/modules/trace/entities'

import type { AddLinkFormValues } from './add-link.schema'

/** The body that makes the link of the form, without a quote; an empty note sends null. */
export function addLinkBody(sourceItemId: string, values: AddLinkFormValues): CreateTraceLinkBody {
  return {
    source_item_id: sourceItemId,
    target_item_id: values.target_item_id,
    link_type: values.link_type,
    note: values.note === '' ? null : values.note,
  }
}
