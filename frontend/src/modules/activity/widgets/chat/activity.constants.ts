import type { EntryAuthor } from './activity.types'

// The words of the activity.

/** The name of the author of an entry, read before it, since its mark is hidden from assistive technology. */
export const entryAuthorNames = {
  user: 'You',
  agent: 'Agents',
  system: 'Update',
} as const satisfies Record<EntryAuthor, string>

export const activityMessages = {
  /** The action that copies the text of an entry. */
  copy: 'Copy',
  copied: 'Copied',
  copyFailed: 'Copying failed. Select the text and copy it instead.',
}
