import { SettingsPage } from '@/modules/user/widgets/settings'

// Pages are kept, hidden, when the user leaves them (Cache Components), so a tab that is visited
// again shows its state as it was left. The page is allowed to block, as it did before.
export const instant = false

export default function Page() {
  return <SettingsPage />
}
