import type { AttentionLevel } from '@/modules/artifact/entities/@x/documents'

import type { DocumentMark } from '../types/documents.types'

/**
 * How a document mark shows: the level of attention it asks (`act` is to act now, `follow` is
 * something in motion, `none` is nothing to do, `quiet` is not there yet; the level gives the
 * color), the letter at the end of its row, and its label.
 */
export const documentMarkLooks = {
  writing: { level: 'follow', letter: 'W', label: 'Being written' },
  review: { level: 'act', letter: 'R', label: 'Waiting for your review' },
  approved: { level: 'none', letter: null, label: 'Approved' },
  draft: { level: 'none', letter: null, label: 'Draft' },
  notStarted: { level: 'quiet', letter: null, label: 'Not started' },
} as const satisfies Record<
  DocumentMark,
  {
    level: AttentionLevel
    letter: string | null
    label: string
  }
>

export const documentsMessages = {
  title: 'Documents',
  empty: {
    title: 'No documents yet',
    description: 'The documents of the project show here once the agents write them.',
  },
  loading: 'Loading the documents',
  loadError: 'The documents could not load.',
  outlineLoading: 'Loading the outline',
  outlineError: 'The outline could not load.',
  location: (titles: readonly string[]) => titles.join(' / '),
  statusWithVersion: (status: string, version: number) => `${status}, version ${String(version)}`,
  count: (count: number, label: string) => `${String(count)} ${label.toLowerCase()}`,
} as const
