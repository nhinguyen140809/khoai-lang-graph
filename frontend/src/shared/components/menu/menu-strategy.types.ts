import type { ComponentType, ReactNode } from 'react'

export interface MenuRootProps {
  isOpen?: boolean | undefined
  onOpenChange?: ((isOpen: boolean) => void) | undefined
  children: ReactNode
}

export interface MenuTriggerProps {
  children: ReactNode
}

export interface MenuContentProps {
  /** The name of the menu, which a sheet that has no anchor shows to screen readers. */
  title: string
  /** The side of the trigger where an anchored menu opens; a sheet ignores it. */
  side?: 'top' | 'right' | 'bottom' | 'left' | undefined
  align?: 'start' | 'center' | 'end' | undefined
  /** The classes of an anchored menu, such as its width; a sheet ignores them. */
  className?: string | undefined
  children: ReactNode
}

export interface MenuItemProps {
  /** Runs when the item is chosen, and the menu closes. */
  onSelect?: (() => void) | undefined
  variant?: 'default' | 'destructive' | undefined
  isDisabled?: boolean | undefined
  children: ReactNode
}

export interface MenuLabelProps {
  children: ReactNode
}

/**
 * How a menu shows on one kind of screen: the parts that `Menu` draws by delegating to
 * them. A strategy keeps the markup and the behavior of its screen, so that the places that use
 * a menu name its parts once and never ask which screen they are on.
 */
export interface MenuStrategy {
  Root: ComponentType<MenuRootProps>
  Trigger: ComponentType<MenuTriggerProps>
  Content: ComponentType<MenuContentProps>
  Item: ComponentType<MenuItemProps>
  Label: ComponentType<MenuLabelProps>
  Separator: ComponentType
}
