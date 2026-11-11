import { EmptyState } from '@/shared/components/state'

// Pages are kept, hidden, when the user leaves them (Cache Components), so a tab that is visited
// again shows its state as it was left. The page is allowed to block, as it did before.
export const instant = false

/** The home page of the user view, until its screens are built. */
export default function Page() {
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <EmptyState
        title="Nothing here yet"
        description="This view of the app is being built."
        className="w-full max-w-md p-0"
      />
    </main>
  )
}
