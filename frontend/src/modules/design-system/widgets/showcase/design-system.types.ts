import type { ComponentType } from 'react'

/**
 * The groups of tabs: what the component library provides, and what the app implements itself in
 * shared/components and shared/lib. A new area of the app becomes a tab of the second group.
 */
export const sectionGroups = [
  { id: 'library', label: 'Library' },
  { id: 'app', label: 'App' },
] as const

/** The tabs of the page, in reading order: the cards of a tab belong together by purpose. */
export const sections = [
  { id: 'foundations', label: 'Foundations', group: 'library' },
  { id: 'actions', label: 'Actions', group: 'library' },
  { id: 'forms', label: 'Forms', group: 'library' },
  { id: 'feedback', label: 'Feedback', group: 'library' },
  { id: 'layers', label: 'Layers', group: 'library' },
  { id: 'navigation', label: 'Navigation', group: 'library' },
  { id: 'data', label: 'Data', group: 'library' },
  { id: 'motion', label: 'Motion', group: 'app' },
  { id: 'agents', label: 'Agents', group: 'app' },
  { id: 'identity', label: 'Identity', group: 'app' },
  { id: 'inputs', label: 'Inputs', group: 'app' },
  { id: 'content', label: 'Content', group: 'app' },
  { id: 'chat', label: 'Chat', group: 'app' },
  { id: 'workspace', label: 'Workspace', group: 'app' },
] as const

/** The id of a tab of the page. */
export type SectionId = (typeof sections)[number]['id']

/**
 * How many of the 12 columns of the grid of a tab a card takes on a wide window: a quarter, a
 * third, half, two thirds, or all of them. On a narrower window the card takes one column of two,
 * or both when it is half or more.
 */
export type CardSpan = 3 | 4 | 6 | 8 | 12

export interface CardEntry {
  id: string
  /** What the search shows. */
  label: string
  /** Other words that find the card in the search. */
  keywords: string
  section: SectionId
  span: CardSpan
  /** What the card renders. */
  View: ComponentType
}
