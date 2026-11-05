import type { EditLockReason } from '../types/documents.types'

export const editAccessMessages = {
  agentsWorking: 'Documents cannot change while the agents work.',
  reviewTakesNoChanges: 'This review does not take changes.',
  notUnderReview: 'Only the documents under review can change now.',
  noReview: 'A document can change while it waits for your review.',
} as const satisfies Record<EditLockReason, string>
