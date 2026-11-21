import { ViewChoicePage } from '@/modules/user/widgets/views'

// Pages are kept, hidden, when the user leaves them (Cache Components); the page is allowed to
// block, as the others are.
export const instant = false

export default function Page() {
  return <ViewChoicePage />
}
