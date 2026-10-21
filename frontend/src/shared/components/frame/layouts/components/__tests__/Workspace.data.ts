import type { EditorTab } from '../../../tabs/editor-tabs.types'

/** The path of the page on screen, the side feature chosen, and the side panel shown. */
export const sidePanelCases = [
  {
    name: 'the side panel of the page opened',
    pathname: '/projects/p1/artifacts',
    chosen: null,
    panel: 'Artifacts',
  },
  {
    name: 'the first feature when the page belongs to none',
    pathname: '/projects/p1/unknown',
    chosen: null,
    panel: 'Console',
  },
  {
    name: 'the feature chosen, over the one of the page',
    pathname: '/projects/p1/artifacts',
    chosen: 'search',
    panel: 'Search',
  },
  {
    name: 'the page on screen when the chosen feature is not given',
    pathname: '/projects/p1/artifacts',
    chosen: 'traceability',
    panel: 'Artifacts',
  },
]

export function tab(id: string): EditorTab {
  return { id, title: id, href: `/projects/p1/${id}` }
}

/** The tabs open, and what the new page gives its tab as it renders: nothing yet, then the tab. */
export const newTabCases = [
  {
    name: 'when the page knows its title at once',
    open: [tab('a'), tab('c')],
    renders: [tab('b')],
  },
  {
    name: 'when the page knows its title after a while',
    open: [tab('a'), tab('c')],
    renders: [null, tab('b')],
  },
]
