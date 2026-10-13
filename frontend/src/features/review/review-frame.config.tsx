import { ClipboardCheckIcon } from 'lucide-react'

import type { TabIcons } from '@/components/layout'

/** The address under which the reviews of the runs of a project are. */
export function reviewsPath(projectId: string): string {
  return `/projects/${encodeURIComponent(projectId)}/review`
}

/** The name of the tab icon of a review, which its page gives `useEditorTab`. */
export const ReviewTabIcon = { Review: 'review.review' } as const

export const reviewTabIcons: TabIcons = { [ReviewTabIcon.Review]: <ClipboardCheckIcon /> }
