'use client'

import type { ComponentType } from 'react'

import { type ByDeskLayout, resolveDeskLayout } from '@/shared/lib/layout'

import type { DeskFrameProps } from '../desk-frame.types'
import { LibraryFrame } from './LibraryFrame'
import { StudioFrame } from './StudioFrame'

/** The frame of each arrangement of the desk: a new arrangement needs an entry, which the type requires. */
const frames: ByDeskLayout<ComponentType<DeskFrameProps>> = {
  library: LibraryFrame,
  studio: StudioFrame,
}

/**
 * The desk, the frame of the user view, in the arrangement that `resolveDeskLayout` gives: the
 * pages of the app are the same in each, and place their items with `useDeskBarItem`,
 * `DeskBarItem` and `useDeskTool`. The desk names no object of the product: what the side list
 * holds, the account menu, the items of the bar and the dialogs come from the modules.
 * @view user
 */
export function Desk(props: DeskFrameProps) {
  const Frame = frames[resolveDeskLayout()]
  return <Frame {...props} />
}
