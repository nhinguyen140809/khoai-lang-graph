import { ClipboardCheckIcon } from 'lucide-react'

import type { TabIcons } from '@/components/layout/activity.types'

/** The address under which the reviews of the runs of a project are. */
export function reviewsPath(projectId: string): string {
  return `/projects/${encodeURIComponent(projectId)}/review`
}

export const reviewTabIcons: TabIcons = { review: <ClipboardCheckIcon /> }
