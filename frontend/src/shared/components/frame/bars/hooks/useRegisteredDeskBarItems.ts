import { useRegisteredItems } from '@/shared/lib/registry'

import { useDeskBarStore } from '../desk-bar.store'
import { type DeskBarItem, DeskBarSide } from '../desk-bar.types'

const isLeft = (item: DeskBarItem) => item.side === DeskBarSide.Left
const isRight = (item: DeskBarItem) => item.side === DeskBarSide.Right

// Constants of the module, so that the items of a side are listed again only when they change.
const onLeft = { filters: [isLeft] }
const onRight = { filters: [isRight] }

/** The items registered with `useDeskBarItem`, by side, in their order. */
export function useRegisteredDeskBarItems() {
  return {
    [DeskBarSide.Left]: useRegisteredItems(useDeskBarStore, onLeft),
    [DeskBarSide.Right]: useRegisteredItems(useDeskBarStore, onRight),
  }
}
