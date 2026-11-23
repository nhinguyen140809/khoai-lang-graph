/** What a message, a piece of work or a review of the chat names, and the reader can open. */
export type ChatReference =
  { kind: 'document'; artifactId: string } | { kind: 'item'; itemId: string }

/** Opens a reference of the chat, in the place where the page of the chat shows it. */
export type ReferenceOpener = (reference: ChatReference) => void

/**
 * Offers a reference of the chat in the place where the page of the chat shows it, without taking
 * that place from what the user is reading: it opens the reference when nothing is open there, and
 * otherwise asks the user first. `label` says in a few words what the reference is and why it is
 * offered.
 */
export type ReferenceRevealer = (reference: ChatReference, label: string) => void
