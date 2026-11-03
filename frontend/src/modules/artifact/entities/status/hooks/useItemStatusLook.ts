'use client'

import { useView } from '@/shared/lib/view'

import type { ItemStatus } from '../item-status.types'
import { itemStatusLook } from '../item-status.utils'

/** `itemStatusLook` in the view of the app. */
export function useItemStatusLook(
  status: ItemStatus,
  options: { isUnderReview: boolean },
): ReturnType<typeof itemStatusLook> {
  return itemStatusLook(status, options, useView())
}
