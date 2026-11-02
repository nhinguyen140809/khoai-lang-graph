import type { placeOpenedTab } from '../editor-tabs.utils'
/** A record of tab ids by group, the group and tab set, and the record after it. */
export const setGroupTabCases = [
  {
    name: 'a group without a tab',
    record: { a: 't1' },
    group: 'b',
    tabId: 't2',
    result: { a: 't1', b: 't2' },
    same: false,
  },
  {
    name: 'a group with another tab',
    record: { a: 't1' },
    group: 'a',
    tabId: 't2',
    result: { a: 't2' },
    same: false,
  },
  {
    name: 'a group that has the tab already',
    record: { a: 't1' },
    group: 'a',
    tabId: 't1',
    result: { a: 't1' },
    same: true,
  },
] as const

/** A record of tab ids by group, the group and tab cleared, and the record after it. */
export const clearGroupTabCases = [
  {
    name: 'a group that holds the tab',
    record: { a: 't1', b: 't2' },
    group: 'a',
    tabId: 't1',
    result: { b: 't2' },
    same: false,
  },
  {
    name: 'a group that holds another tab',
    record: { a: 't1' },
    group: 'a',
    tabId: 't2',
    result: { a: 't1' },
    same: true,
  },
  {
    name: 'a group without a tab',
    record: { a: 't1' },
    group: 'z',
    tabId: 't1',
    result: { a: 't1' },
    same: true,
  },
] as const

const tabA = { id: 'a', title: 'A', href: '/a' as const }
const tabB = { id: 'b', title: 'B', href: '/b' as const }
const tabC = { id: 'c', title: 'C', href: '/c' as const }
const tabD = { id: 'd', title: 'D', href: '/d' as const }

const noOptions = {
  previewId: undefined,
  lastShownId: undefined,
  isKept: false,
  replaceTabId: null,
}

/** A tab that opens in a group, what the group holds then, and which tab is its preview tab. */
export const placeOpenedTabCases: {
  name: string
  input: Parameters<typeof placeOpenedTab>[0]
  tabs: { id: string; title: string }[]
  previewId: string | undefined
}[] = [
  {
    name: 'a new preview tab at the end when no tab is shown',
    input: { ...noOptions, tabs: [tabA], tab: tabB },
    tabs: [tabA, tabB],
    previewId: 'b',
  },
  {
    name: 'a new preview tab after the tab shown last',
    input: { ...noOptions, tabs: [tabA, tabC], tab: tabB, lastShownId: 'a' },
    tabs: [tabA, tabB, tabC],
    previewId: 'b',
  },
  {
    name: 'a new preview tab in the place of the preview tab open',
    input: { ...noOptions, tabs: [tabA, tabB], tab: tabC, previewId: 'b' },
    tabs: [tabA, tabC],
    previewId: 'c',
  },
  {
    name: 'a new kept tab after the tab shown last, leaving the preview tab',
    input: {
      ...noOptions,
      tabs: [tabA, tabB],
      tab: tabC,
      previewId: 'b',
      lastShownId: 'a',
      isKept: true,
    },
    tabs: [tabA, tabC, tabB],
    previewId: 'b',
  },
  {
    name: 'a tab already open, which stays where it is and stays the preview tab',
    input: { ...noOptions, tabs: [tabA, tabB], tab: tabB, previewId: 'b' },
    tabs: [tabA, tabB],
    previewId: 'b',
  },
  {
    name: 'a tab already open that is asked to be kept, which stops being the preview tab',
    input: { ...noOptions, tabs: [tabA, tabB], tab: tabB, previewId: 'b', isKept: true },
    tabs: [tabA, tabB],
    previewId: undefined,
  },
  {
    name: 'a tab in the place of a kept tab, which stays kept',
    input: { ...noOptions, tabs: [tabA, tabB], tab: tabC, previewId: 'a', replaceTabId: 'b' },
    tabs: [tabA, tabC],
    previewId: 'a',
  },
  {
    name: 'a tab in the place of the preview tab, which becomes the preview tab',
    input: { ...noOptions, tabs: [tabA, tabB], tab: tabC, previewId: 'b', replaceTabId: 'b' },
    tabs: [tabA, tabC],
    previewId: 'c',
  },
  {
    name: 'a tab asked to take the place of a tab that is closed, which opens as a new preview tab',
    input: { ...noOptions, tabs: [tabA], tab: tabD, replaceTabId: 'gone' },
    tabs: [tabA, tabD],
    previewId: 'd',
  },
]

/** A record of the tab of each group, the group to set, and the tab to set or none to clear. */
export const setGroupTabOrNoneCases = [
  { name: 'a tab that is new', record: { g: 'a' }, tabId: 'b', result: { g: 'b' }, same: false },
  {
    name: 'the tab it has already',
    record: { g: 'a' },
    tabId: 'a',
    result: { g: 'a' },
    same: true,
  },
  {
    name: 'none, for a group that has one',
    record: { g: 'a' },
    tabId: undefined,
    result: {},
    same: false,
  },
  {
    name: 'none, for a group that has none',
    record: { h: 'a' },
    tabId: undefined,
    result: { h: 'a' },
    same: true,
  },
]
