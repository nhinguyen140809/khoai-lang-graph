import type { EditorTab } from '../../editor-tabs.types'

export const requirement: EditorTab = { id: 'i1', title: 'REQ-001', href: '/projects/p1/search/i1' }
export const ambiguity: EditorTab = {
  id: 'i2',
  title: 'AMB-001',
  href: '/projects/p1/search/i2',
  icon: 'artifact',
}

/** The tabs of a group and the one on screen, the titles of the strip, and the one marked. */
export const onScreenCases = [
  {
    name: 'the open editors, the one on screen marked',
    group: 'p1:search',
    tabs: [requirement, ambiguity],
    onScreen: requirement.id,
    titles: ['REQ-001', 'AMB-001'],
    current: 'REQ-001',
  },
  {
    name: 'the tab of the page on screen, whatever its address holds',
    group: 'p1',
    tabs: [{ id: 'settings', title: 'Settings', href: '/projects/p1/settings?section=members' }],
    onScreen: 'settings',
    titles: ['Settings'],
    current: 'Settings',
  },
  {
    name: 'the tabs of every feature of a project in one strip',
    group: 'p1',
    tabs: [
      { id: 'console', title: 'Console', href: '/projects/p1/console' },
      { id: 'review:r1', title: 'Review', href: '/projects/p1/review/r1' },
      { id: 'run', title: 'Run 1', href: '/projects/p1/workflow/r1', icon: 'run' },
    ],
    onScreen: 'run',
    titles: ['Console', 'Review', 'Run 1'],
    current: 'Run 1',
  },
]

/** A tab, and the lucide class of its icon: the one it names, else the one of its feature, else a file. */
export const tabIconCases = [
  { name: 'the icon of its feature', tab: requirement, icon: 'lucide-search' },
  { name: 'the icon it names', tab: ambiguity, icon: 'lucide-file-text' },
  {
    name: 'a file outside every feature',
    tab: { id: 'x', title: 'Elsewhere', href: '/projects/p1/other' },
    icon: 'lucide-file',
  },
]

/** The tabs and the one on screen, the tab closed with its button, and the pages opened after. */
export const closeTabCases = [
  {
    name: 'shows the next tab after closing the tab on screen',
    tabs: [requirement, ambiguity],
    onScreen: requirement.id,
    close: requirement.title,
    opens: [ambiguity.href],
  },
  {
    name: 'shows the previous tab after closing the last tab, on screen',
    tabs: [requirement, ambiguity],
    onScreen: ambiguity.id,
    close: ambiguity.title,
    opens: [requirement.href],
  },
  {
    name: 'goes to the feature after closing the only tab',
    tabs: [requirement],
    onScreen: requirement.id,
    close: requirement.title,
    opens: ['/projects/p1/search'],
  },
  {
    name: 'does not navigate when a tab that is not on screen closes',
    tabs: [requirement, ambiguity],
    onScreen: requirement.id,
    close: ambiguity.title,
    opens: [],
  },
]
