import { z } from 'zod'

import { addLinkMessages, linkNote } from './add-link.constants'

/** The form that makes a link; its fields are named after the fields of the request. */
export const addLinkFormSchema = z.object({
  link_type: z.string().min(1, addLinkMessages.chooseLinkType),
  target_item_id: z.string().min(1, addLinkMessages.chooseTarget),
  note: z.string().trim().max(linkNote.maxLength, addLinkMessages.noteTooLong),
})

export type AddLinkFormValues = z.input<typeof addLinkFormSchema>
