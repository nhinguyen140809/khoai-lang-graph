import type { AttentionLevel } from '@/modules/artifact/entities/@x/documents'

import type { DocumentMark } from '../types/documents.types'

/** The words for an item that is loading, that could not load, or that does not exist, wherever it is read. */
export const itemLoadMessages = {
  loading: 'Loading the item',
  loadError: 'The item could not load.',
  notFound: { title: 'Item not found', description: 'This item does not exist, or was deleted.' },
} as const

/** The words of the links of an item, wherever they show. */
export const itemLinkMessages = {
  moreLinks: (count: number) => `${String(count)} more`,
  linksLoadError: 'The links could not load.',
  /** The title of the folded links of a profile: what the item is linked to, which is not always what backs it. */
  relations: 'Related items',
} as const

/** How many chips of one link group show before "N more" replaces the rest. */
export const linkChipsShown = 5

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
