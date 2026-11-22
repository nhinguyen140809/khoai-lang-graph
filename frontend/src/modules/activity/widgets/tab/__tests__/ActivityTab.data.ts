import { type ChatReference } from '@/modules/activity/entities'

/** A reference of the chat and the page of the workbench that it opens. */
export const referenceCases: { name: string; reference: ChatReference; href: string }[] = [
  {
    name: 'a document',
    reference: { kind: 'document', artifactId: 'a1' },
    href: '/projects/p1/documents/a1',
  },
  { name: 'an item', reference: { kind: 'item', itemId: 'i1' }, href: '/projects/p1/items/i1' },
]
