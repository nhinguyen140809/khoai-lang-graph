'use client'

import { createContext, use } from 'react'

import { useIsMobile } from '@/shared/lib/viewport'

import { drawerStrategy } from './DrawerStrategy'
import { dropdownStrategy } from './DropdownStrategy'
import type {
  MenuContentProps,
  MenuItemProps,
  MenuLabelProps,
  MenuRootProps,
  MenuStrategy,
  MenuTriggerProps,
} from './menu-strategy.types'

// The strategy of each kind of screen; `Menu` picks one, once, and its parts use it.
const strategies: Record<'wide' | 'narrow', MenuStrategy> = {
  wide: dropdownStrategy,
  narrow: drawerStrategy,
}

// Items of the menu that are used inside a plain dropdown, outside a `Menu`, still draw
// as dropdown items.
const StrategyContext = createContext<MenuStrategy>(dropdownStrategy)

/**
 * A menu that opens beside its trigger on a wide screen and as a sheet from the foot of the screen
 * on a narrow one. Name its parts, `MenuTrigger`, `MenuContent` and the items,
 * once: each is drawn by the strategy of the screen, so nothing at the place of use asks which
 * screen it is.
 */
export function Menu(props: MenuRootProps) {
  const strategy = strategies[useIsMobile() ? 'narrow' : 'wide']
  return (
    <StrategyContext value={strategy}>
      <strategy.Root {...props} />
    </StrategyContext>
  )
}

/** The element that opens the menu; it takes the one child as the trigger itself. */
export function MenuTrigger(props: MenuTriggerProps) {
  const { Trigger } = use(StrategyContext)
  return <Trigger {...props} />
}

export function MenuContent(props: MenuContentProps) {
  const { Content } = use(StrategyContext)
  return <Content {...props} />
}

export function MenuItem(props: MenuItemProps) {
  const { Item } = use(StrategyContext)
  return <Item {...props} />
}

export function MenuLabel(props: MenuLabelProps) {
  const { Label } = use(StrategyContext)
  return <Label {...props} />
}

export function MenuSeparator() {
  const { Separator } = use(StrategyContext)
  return <Separator />
}
