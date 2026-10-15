import type { EditorTab } from '../editor-tabs.schema'
import type { useEditorTabsStore } from '../editor-tabs.store'

type Store = ReturnType<typeof useEditorTabsStore.getState>

/** One thing done to the tabs of `group`. */
type Step = (store: Store) => void

/** The group of every case. */
export const group = 'p1:search'

export const req: EditorTab = { id: 'i1', title: 'REQ-001', href: '/projects/p1/search/i1' }
export const ambiguity: EditorTab = { id: 'i2', title: 'AMB-001', href: '/projects/p1/search/i2' }
export const conflict: EditorTab = {
  id: 'i3',
  title: 'CONF-001',
  href: '/projects/p1/search/i3',
  icon: 'item',
}

const open =
  (tab: EditorTab, options?: { keep: boolean }): Step =>
  (store) => {
    store.openTab(group, tab, options)
  }
const kept = { keep: true }
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
    name: 'opens a tab once and updates its title',
    steps: [open(req, kept), open(ambiguity, kept), open({ ...req, title: 'Renamed' })],
    tabs: [{ ...req, title: 'Renamed' }, ambiguity],
    preview: null,
    onScreen: req.id,
    lastShown: req.id,
    keepNext: null,
  },
  {
    name: 'has no tab on screen once its page leaves, and keeps the tab shown last',
    steps: [open(req, kept), leave(req)],
    tabs: [req],
    preview: null,
    onScreen: null,
    lastShown: req.id,
    keepNext: null,
  },
  {
    name: 'opens a new tab next to the tab shown last, also after its page left the screen',
    steps: [open(req, kept), open(ambiguity, kept), open(req), leave(req), open(conflict)],
    tabs: [req, conflict, ambiguity],
    preview: conflict.id,
    onScreen: conflict.id,
    lastShown: conflict.id,
    keepNext: null,
  },
  {
    name: 'opens a new tab last once the tab shown last is closed',
    steps: [open(ambiguity, kept), open(req, kept), close(req), open(conflict)],
    tabs: [ambiguity, conflict],
    preview: conflict.id,
    onScreen: conflict.id,
    lastShown: conflict.id,
    keepNext: null,
  },
  {
    name: 'opens a new page in the preview tab, in the place of the preview tab open',
    steps: [open(req, kept), open(ambiguity), open(req), open(conflict)],
    tabs: [req, conflict],
    preview: conflict.id,
    onScreen: conflict.id,
    lastShown: conflict.id,
    keepNext: null,
  },
  {
    name: 'opens a kept tab next to the tab shown last, and leaves the preview tab',
    steps: [open(req), open(ambiguity, kept)],
    tabs: [req, ambiguity],
    preview: req.id,
    onScreen: ambiguity.id,
    lastShown: ambiguity.id,
    keepNext: null,
  },
  {
    name: 'keeps the preview tab, so the next page opens a new preview tab',
    steps: [open(req), keep(req), open(ambiguity)],
    tabs: [req, ambiguity],
    preview: ambiguity.id,
    onScreen: ambiguity.id,
    lastShown: ambiguity.id,
    keepNext: null,
  },
  {
    name: 'keeps a page asked to be kept at once when its tab is open',
    steps: [open(req), keepPage(req)],
    tabs: [req],
    preview: null,
    onScreen: req.id,
    lastShown: req.id,
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
    steps: [open(req), keepPage(ambiguity), open(ambiguity)],
    tabs: [req, ambiguity],
    preview: req.id,
    onScreen: ambiguity.id,
    lastShown: ambiguity.id,
    keepNext: null,
  },
  {
    name: 'closes several tabs at once, the preview tab and the tab shown last among them',
    steps: [open(req, kept), open(ambiguity, kept), open(conflict), close(ambiguity, conflict)],
    tabs: [req],
    preview: null,
    onScreen: conflict.id,
    lastShown: null,
    keepNext: null,
  },
  {
    name: 'has no preview tab once the preview tab is closed',
    steps: [open(req), close(req)],
    tabs: [],
    preview: null,
    onScreen: req.id,
    lastShown: null,
    keepNext: null,
  },
]

/** The state stored by a version of the store, and the tabs and preview tabs read from it. */
export const storedTabsCases = [
  {
    name: 'the tabs and preview tabs, without the fields of an older version',
    stored: {
      groups: { [group]: [ambiguity, conflict] },
      preview: { [group]: conflict.id },
      lastHrefs: {},
    },
    groups: { [group]: [ambiguity, conflict] },
    preview: { [group]: conflict.id },
  },
  {
    name: 'the tabs of a version without preview tabs',
    stored: { groups: { [group]: [ambiguity] } },
    groups: { [group]: [ambiguity] },
    preview: {},
  },
  {
    name: 'nothing of tabs that do not have the expected shape',
    stored: { groups: { [group]: [{ id: 1 }] } },
    groups: {},
    preview: {},
  },
]

/** Open tabs, a tab that closes with the tabs `closing`, and the tab to show after them. */
export const neighborTabCases = [
  { name: 'the next tab', tabs: [req, ambiguity], id: req.id, neighbor: ambiguity },
  {
    name: 'the previous tab of the last one',
    tabs: [req, ambiguity],
    id: ambiguity.id,
    neighbor: req,
  },
  { name: 'none for the only tab', tabs: [req], id: req.id, neighbor: undefined },
  { name: 'none for a tab that is not open', tabs: [req], id: ambiguity.id, neighbor: undefined },
  {
    name: 'the next tab that stays open',
    tabs: [req, ambiguity, conflict],
    id: req.id,
    closing: [req.id, ambiguity.id],
    neighbor: conflict,
  },
  {
    name: 'the previous tab that stays open',
    tabs: [req, ambiguity, conflict],
    id: conflict.id,
    closing: [ambiguity.id, conflict.id],
    neighbor: req,
  },
  {
    name: 'none when every tab closes',
    tabs: [req, ambiguity],
    id: req.id,
    closing: [req.id, ambiguity.id],
    neighbor: undefined,
  },
]
