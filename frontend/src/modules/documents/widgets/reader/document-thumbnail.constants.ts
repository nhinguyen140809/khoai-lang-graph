import type { DocumentMark } from '@/modules/documents/entities'

/**
 * How the thumbnail of a document behaves by its mark, so that each mark has its own entry and
 * none is a branch of a condition: whether it opens in the reader, and whether the name of the
 * mark shows under it. A document being written or waiting for the user is marked under its
 * thumbnail; one that is done or in draft opens without a word; one that is not started only reads,
 * muted, and opens nothing.
 */
export const documentMarkViews = {
  writing: { isOpenable: true, showsMark: true },
  review: { isOpenable: true, showsMark: true },
  approved: { isOpenable: true, showsMark: false },
  draft: { isOpenable: true, showsMark: false },
  notStarted: { isOpenable: false, showsMark: false },
} as const satisfies Record<DocumentMark, { isOpenable: boolean; showsMark: boolean }>
