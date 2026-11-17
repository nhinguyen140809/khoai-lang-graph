import { useRegisteredItems } from '@/shared/lib/registry'

import { useStatusBarStore } from '../status-bar.store'
import { type StatusBarItem, StatusBarSide } from '../status-bar.types'

const isLeft = (item: StatusBarItem) => item.side === StatusBarSide.Left
const isRight = (item: StatusBarItem) => item.side === StatusBarSide.Right

// Constants of the module, so that the items of a side are listed again only when they change.
const onLeft = { filters: [isLeft] }
const onRight = { filters: [isRight] }

/** The items registered with `useStatusBarItem`, by side, in their order. */
export function useRegisteredStatusBarItems() {
  return {
    [StatusBarSide.Left]: useRegisteredItems(useStatusBarStore, onLeft),
    [StatusBarSide.Right]: useRegisteredItems(useStatusBarStore, onRight),
  }
}
