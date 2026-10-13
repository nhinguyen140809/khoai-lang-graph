import { ClipboardCheckIcon } from 'lucide-react'

import type { TabIcons } from '@/frame'

/** The name of the tab icon of a review, which its page gives `useEditorTab`. */
export const ReviewTabIcon = { Review: 'review.review' } as const

export const reviewTabIcons: TabIcons = { [ReviewTabIcon.Review]: <ClipboardCheckIcon /> }
