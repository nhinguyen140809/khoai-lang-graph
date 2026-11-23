import { ProjectCards, ProjectStartPage } from '@/modules/project/widgets/start'
import { byDeskLayout } from '@/shared/lib/layout'

// Pages are kept, hidden, when the user leaves them (Cache Components), so a page that is visited
// again shows its state as it was left. The page is allowed to block, as the others are.
export const instant = false

export default function Page() {
  // A desk with a side list lists the projects there; one without lists them here, as cards.
  return (
    <ProjectStartPage projects={byDeskLayout({ library: undefined, studio: <ProjectCards /> })} />
  )
}
