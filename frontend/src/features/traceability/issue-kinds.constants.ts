/** The kinds of item that are an issue, and the link types that tie an issue to an item. */
export const issueKinds = [
  { kind: 'ambiguity_issue', label: 'Ambiguity issues' },
  { kind: 'conflict', label: 'Conflicts' },
  { kind: 'validation_issue', label: 'Validation issues' },
] as const

/** The link types from an issue to the items it is about. */
export const issueLinkTypes = ['concerns', 'flags'] as const

/** The value of `status` of an issue that is still open. */
export const OPEN_STATUS = 'open'
