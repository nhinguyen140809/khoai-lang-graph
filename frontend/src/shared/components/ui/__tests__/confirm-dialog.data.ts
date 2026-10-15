import { ArchiveIcon } from 'lucide-react'
import { createElement, type ReactNode } from 'react'

/** The props of the dialog about its icon, and the icon it shows: a class of lucide, or none. */
export const iconCases: {
  name: string
  props: { destructive?: boolean; icon?: ReactNode }
  icon: string | null
}[] = [
  {
    name: 'a warning sign for a destructive action',
    props: { destructive: true },
    icon: 'lucide-triangle-alert',
  },
  {
    name: 'the icon given',
    props: { icon: createElement(ArchiveIcon) },
    icon: 'lucide-archive',
  },
  {
    name: 'the icon given in place of the warning sign',
    props: { destructive: true, icon: createElement(ArchiveIcon) },
    icon: 'lucide-archive',
  },
  { name: 'no icon when asked for none', props: { destructive: true, icon: null }, icon: null },
  { name: 'no icon for an action that is not destructive', props: {}, icon: null },
]
