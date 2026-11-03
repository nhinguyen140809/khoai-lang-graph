import { recordChangeMessages } from '@/modules/artifact/entities'

export const restoreMessages = {
  button: 'Restore this version',
  itemTitle: (version: number) => `Restore version ${String(version)}?`,
  artifactTitle: (version: number) => `Restore version ${String(version)} of this document?`,
  itemDescription: (version: number) =>
    `The item gets the content of version ${String(version)} as a new version. The current content stays in the history.`,
  artifactDescription: (version: number) =>
    `The document and each of its items get their content of version ${String(version)} as a new version. The current content stays in the history.`,
  confirm: 'Restore',
  restored: (version: number) => `Restored version ${String(version)}`,
  locked: recordChangeMessages.locked,
} as const
