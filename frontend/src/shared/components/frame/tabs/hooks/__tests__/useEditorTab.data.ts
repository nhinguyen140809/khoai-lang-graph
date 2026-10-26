import type { EditorTab } from '../../editor-tabs.types'

export const group = 'p1'

export const requirement: EditorTab = { id: 'REQ-001', title: 'REQ-001', href: '/items/1' }

/** A tab that the page asks for, and what the group holds after the page opens it. */
export const openedTabCases = [
  { name: 'a tab without an icon', tab: requirement, opened: requirement },
  {
    name: 'a tab with an icon',
    tab: { ...requirement, icon: 'FileText' },
    opened: { ...requirement, icon: 'FileText' },
  },
]
