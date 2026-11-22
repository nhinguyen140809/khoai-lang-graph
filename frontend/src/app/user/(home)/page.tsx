import { ProjectStartPage } from '@/modules/project/widgets/start'

// Pages are kept, hidden, when the user leaves them (Cache Components), so a page that is visited
// again shows its state as it was left. The page is allowed to block, as the others are.
export const instant = false

export default function Page() {
  return <ProjectStartPage />
}
