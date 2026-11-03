import type { useEditorTabsStore } from '../editor-tabs.store'
import type { EditorTab } from '../editor-tabs.types'

type Store = ReturnType<typeof useEditorTabsStore.getState>

/** One thing done to the tabs of `group`. */
type Step = (store: Store) => void

/** The group of every case. */
export const group = 'p1:search'

export const requirement: EditorTab = { id: 'i1', title: 'REQ-001', href: '/projects/p1/search/i1' }
export const ambiguity: EditorTab = { id: 'i2', title: 'AMB-001', href: '/projects/p1/search/i2' }
export const conflict: EditorTab = {
  id: 'i3',
  title: 'CONF-001',
  href: '/projects/p1/search/i3',
  icon: 'item',
}

const open =
  (tab: EditorTab, options?: { keep?: boolean; isTitleProvisional?: boolean }): Step =>
  (store) => {
    store.openTab(group, tab, options)
  }
const kept = { keep: true }
const provisional = { isTitleProvisional: true }
const leave =
  (tab: EditorTab): Step =>
  (store) => {
    store.leaveTab(group, tab.id)
  }
const close =
  (...tabs: EditorTab[]): Step =>
  (store) => {
    store.closeTabs(
      group,
      tabs.map(({ id }) => id),
    )
  }
const keep =
  (tab: EditorTab): Step =>
  (store) => {
    store.keepTab(group, tab.id)
  }
const keepPage =
  (tab: EditorTab): Step =>
  (store) => {
    store.keepPage(tab.href)
  }

const nameAs =
  (next: EditorTab, title: string): Step =>
  (store) => {
    store.namePage(next.href, title)
  }

const replace =
  (next: EditorTab, current: EditorTab): Step =>
  (store) => {
    store.replacePage(next.href, current.id)
  }

interface TabStepsCase {
  name: string
  steps: Step[]
  /** The tabs of the group, and the ids of its preview tab, its tab on screen and its tab shown last. */
  tabs: EditorTab[]
  preview: string | null
  onScreen: string | null
  lastShown: string | null
  keepNext: string | null
}

/** Things done to the tabs, in order, and the tabs they leave. */
export const tabStepsCases: TabStepsCase[] = [
  {
    name: 'opens a page in the place of a kept tab on screen, and keeps the new tab',
    steps: [
      open(requirement, kept),
      open(ambiguity, kept),
      replace(conflict, ambiguity),
      open(conflict),
    ],
    tabs: [requirement, conflict],
    preview: null,
    onScreen: conflict.id,
    lastShown: conflict.id,
    keepNext: null,
  },
  {
    name: 'opens a page in the place of the preview tab on screen, and the new tab is the preview',
    steps: [open(requirement, kept), open(ambiguity), replace(conflict, ambiguity), open(conflict)],
    tabs: [requirement, conflict],
    preview: conflict.id,
    onScreen: conflict.id,
    lastShown: conflict.id,
    keepNext: null,
  },
  {
    name: 'opens a tab once and updates its title',
    steps: [
      open(requirement, kept),
      open(ambiguity, kept),
      open({ ...requirement, title: 'Renamed' }),
    ],
    tabs: [{ ...requirement, title: 'Renamed' }, ambiguity],
    preview: null,
    onScreen: requirement.id,
    lastShown: requirement.id,
    keepNext: null,
  },
  {
    name: 'has no tab on screen once its page leaves, and keeps the tab shown last',
    steps: [open(requirement, kept), leave(requirement)],
    tabs: [requirement],
    preview: null,
    onScreen: null,
    lastShown: requirement.id,
    keepNext: null,
  },
  {
    name: 'opens a new tab next to the tab shown last, also after its page left the screen',
    steps: [
      open(requirement, kept),
      open(ambiguity, kept),
      open(requirement),
      leave(requirement),
      open(conflict),
    ],
    tabs: [requirement, conflict, ambiguity],
    preview: conflict.id,
    onScreen: conflict.id,
    lastShown: conflict.id,
    keepNext: null,
  },
  {
    name: 'opens a new tab last once the tab shown last is closed',
    steps: [open(ambiguity, kept), open(requirement, kept), close(requirement), open(conflict)],
    tabs: [ambiguity, conflict],
    preview: conflict.id,
    onScreen: conflict.id,
    lastShown: conflict.id,
    keepNext: null,
  },
  {
    name: 'opens a new page in the preview tab, in the place of the preview tab open',
    steps: [open(requirement, kept), open(ambiguity), open(requirement), open(conflict)],
    tabs: [requirement, conflict],
    preview: conflict.id,
    onScreen: conflict.id,
    lastShown: conflict.id,
    keepNext: null,
  },
  {
    name: 'opens a kept tab next to the tab shown last, and leaves the preview tab',
    steps: [open(requirement), open(ambiguity, kept)],
    tabs: [requirement, ambiguity],
    preview: requirement.id,
    onScreen: ambiguity.id,
    lastShown: ambiguity.id,
    keepNext: null,
  },
  {
    name: 'keeps the preview tab, so the next page opens a new preview tab',
    steps: [open(requirement), keep(requirement), open(ambiguity)],
    tabs: [requirement, ambiguity],
    preview: ambiguity.id,
    onScreen: ambiguity.id,
    lastShown: ambiguity.id,
    keepNext: null,
  },
  {
    name: 'keeps a page asked to be kept at once when its tab is open',
    steps: [open(requirement), keepPage(requirement)],
    tabs: [requirement],
    preview: null,
    onScreen: requirement.id,
    lastShown: requirement.id,
    keepNext: null,
  },
  {
    name: 'waits for the tab of a page asked to be kept before it opens',
    steps: [keepPage(ambiguity)],
    tabs: [],
    preview: null,
    onScreen: null,
    lastShown: null,
    keepNext: ambiguity.href,
  },
  {
    name: 'keeps the tab of a page asked to be kept when it opens',
    steps: [open(requirement), keepPage(ambiguity), open(ambiguity)],
    tabs: [requirement, ambiguity],
    preview: requirement.id,
    onScreen: ambiguity.id,
    lastShown: ambiguity.id,
    keepNext: null,
  },
  {
    name: 'closes several tabs at once, the preview tab and the tab shown last among them',
    steps: [
      open(requirement, kept),
      open(ambiguity, kept),
      open(conflict),
      close(ambiguity, conflict),
    ],
    tabs: [requirement],
    preview: null,
    onScreen: conflict.id,
    lastShown: null,
    keepNext: null,
  },
  {
    name: 'keeps the title of an open tab when the page opens it with a stand-in title',
    steps: [open(requirement, kept), open({ ...requirement, title: 'Item' }, provisional)],
    tabs: [requirement],
    preview: null,
    onScreen: requirement.id,
    lastShown: requirement.id,
    keepNext: null,
  },
  {
    name: 'opens a tab with the title that the opener gave while the page has none of its own',
    steps: [
      nameAs(requirement, 'Find a mentor'),
      open({ ...requirement, title: 'Item' }, provisional),
    ],
    tabs: [{ ...requirement, title: 'Find a mentor' }],
    preview: requirement.id,
    onScreen: requirement.id,
    lastShown: requirement.id,
    keepNext: null,
  },
  {
    name: 'opens a tab with the title of the page once the page knows it',
    steps: [nameAs(requirement, 'Find a mentor'), open(requirement)],
    tabs: [requirement],
    preview: requirement.id,
    onScreen: requirement.id,
    lastShown: requirement.id,
    keepNext: null,
  },
  {
    name: 'opens a tab with the stand-in title when none is open yet',
    steps: [open({ ...requirement, title: 'Item' }, provisional)],
    tabs: [{ ...requirement, title: 'Item' }],
    preview: requirement.id,
    onScreen: requirement.id,
    lastShown: requirement.id,
    keepNext: null,
  },
  {
    name: 'has no preview tab once the preview tab is closed',
    steps: [open(requirement), close(requirement)],
    tabs: [],
    preview: null,
    onScreen: requirement.id,
    lastShown: null,
    keepNext: null,
  },
]

/** The state stored by a version of the store, and the tabs and preview tabs read from it. */
/** The other group of the cases on stored tabs. */
export const otherGroup = 'p2:search'

/** What the storage holds for each group, and the tabs and preview tabs that the store reads. */
export const storedTabsCases = [
  {
    name: 'the tabs and preview tab of a group, without the fields of an older version',
    stored: { [group]: { tabs: [ambiguity, conflict], preview: conflict.id, lastHref: '/' } },
    groups: { [group]: [ambiguity, conflict] },
    preview: { [group]: conflict.id },
  },
  {
    name: 'the tabs of a group without a preview tab',
    stored: { [group]: { tabs: [ambiguity] } },
    groups: { [group]: [ambiguity] },
    preview: {},
  },
  {
    name: 'the groups of the expected shape only',
    stored: { [group]: { tabs: [{ id: 1 }] }, [otherGroup]: { tabs: [requirement] } },
    groups: { [otherGroup]: [requirement] },
    preview: {},
  },
]

/** Open tabs, a tab that closes with the tabs `closing`, and the tab to show after them. */
export const neighborTabCases = [
  { name: 'the next tab', tabs: [requirement, ambiguity], id: requirement.id, neighbor: ambiguity },
  {
    name: 'the previous tab of the last one',
    tabs: [requirement, ambiguity],
    id: ambiguity.id,
    neighbor: requirement,
  },
  { name: 'none for the only tab', tabs: [requirement], id: requirement.id, neighbor: undefined },
  {
    name: 'none for a tab that is not open',
    tabs: [requirement],
    id: ambiguity.id,
    neighbor: undefined,
  },
  {
    name: 'the next tab that stays open',
    tabs: [requirement, ambiguity, conflict],
    id: requirement.id,
    closing: [requirement.id, ambiguity.id],
    neighbor: conflict,
  },
  {
    name: 'the previous tab that stays open',
    tabs: [requirement, ambiguity, conflict],
    id: conflict.id,
    closing: [ambiguity.id, conflict.id],
    neighbor: requirement,
  },
  {
    name: 'none when every tab closes',
    tabs: [requirement, ambiguity],
    id: requirement.id,
    closing: [requirement.id, ambiguity.id],
    neighbor: undefined,
  },
]
