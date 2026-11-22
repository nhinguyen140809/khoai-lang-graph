import { DocumentsHomePage } from '@/modules/documents/widgets/document'

// Pages are kept, hidden, when the user leaves them (Cache Components), so a tab that is visited
// again shows its state as it was left. The page is allowed to block, as it did before.
export const instant = false

/** The start page of Documents: it asks to choose a document in the side panel. */
export default function Page() {
  return <DocumentsHomePage />
}
