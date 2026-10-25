import { redirect } from 'next/navigation'

import { routes } from '@/shared/routes'

export default function Page() {
  redirect(routes.projects())
}
