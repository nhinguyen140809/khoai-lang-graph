/**
 * The ids of the commands that an answer may ask the page to run, the keys of the catalog of the
 * docs (`commands.catalog.json`). The components that can do each one register a command of that id
 * (`useCommands`), and a test fails when the catalog gains a key that is not here, or loses one.
 */
export const uiCommandIds = {
  openDocument: 'open_document',
  openItem: 'open_item',
  openReview: 'open_review',
  openSettings: 'open_settings',
} as const
