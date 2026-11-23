import { TraceHomePage } from '@/modules/traceability/widgets/home'

// Pages are kept, hidden, when the user leaves them (Cache Components), so a tab that is visited
// again shows its state as it was left. The page is allowed to block, as it did before.
export const instant = false

/** The start page of Trace: it asks to open a page from the side panel. */
export default function Page() {
  return <TraceHomePage />
}
