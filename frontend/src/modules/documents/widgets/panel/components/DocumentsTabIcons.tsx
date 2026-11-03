'use client'

import { useTabIcons } from '@/shared/components/frame'

import { documentTabIcons } from '../documents-frame.config'

/** Registers the icons of the tabs of Documents with the frame, for as long as the screen shows. */
export function DocumentsTabIcons() {
  useTabIcons(documentTabIcons)
  return null
}
