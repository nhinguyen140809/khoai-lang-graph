/** What a message, a piece of work or a review of the chat names, and the reader can open. */
export type ChatReference =
  { kind: 'document'; artifactId: string } | { kind: 'item'; itemId: string }

/** Opens a reference of the chat, in the place where the page of the chat shows it. */
export type ReferenceOpener = (reference: ChatReference) => void
