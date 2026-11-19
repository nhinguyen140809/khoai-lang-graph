import type { ReactNode } from 'react'

import { ProjectCommands } from '@/modules/project/widgets/commands'

// The palette is the search of the user view, so it offers more projects than the menus of the
// developer view do.
const deskPaletteProjectCount = 30

interface HomeLayoutProps {
  children: ReactNode
}

// Pages are kept, hidden, when the user leaves them (Cache Components). The layout is allowed to
// block, as its pages are.
export const instant = false

/** The pages outside a project: the page, with the commands that open or start a project. */
export default function HomeLayout({ children }: HomeLayoutProps) {
  return (
    <>
      <ProjectCommands count={deskPaletteProjectCount} />
      {children}
    </>
  )
}
