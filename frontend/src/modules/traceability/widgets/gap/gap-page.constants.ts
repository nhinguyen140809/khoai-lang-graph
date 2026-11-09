export const gapPageMessages = {
  /** The tab of the page while the title of the gap is not known yet. */
  tabFallback: 'Trace',
  it: 'It',
  madeFrom: (version: number) => `Link made from version ${String(version)}`,
  replaced: 'Replaced by another item',
  now: (version: number) => `Now version ${String(version)}`,
  loading: 'Loading the items',
  loadError: 'The items could not load.',
  empty: 'This list is empty.',
} as const
