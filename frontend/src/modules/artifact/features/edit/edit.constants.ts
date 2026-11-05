import { recordChangeMessages } from '@/modules/artifact/entities'

export const editMessages = {
  edit: 'Edit',
  save: 'Save',
  saving: 'Saving',
  saveClean: 'Nothing to save yet.',
  cancel: 'Cancel',
  saved: 'Saved',
  title: 'Title',
  summary: 'Summary',
  titleRequired: 'Enter a title.',
  discard: {
    title: 'Discard your changes?',
    description: 'What you changed in this form is lost.',
    confirm: 'Discard',
    cancel: 'Keep editing',
  },
  locked: recordChangeMessages.locked,
  conflict: {
    item: 'This item changed since you opened it.',
    artifact: 'This document changed since you opened it.',
    lost: 'Reload to see the new version; what you typed is not kept.',
    reload: 'Reload',
  },
} as const
