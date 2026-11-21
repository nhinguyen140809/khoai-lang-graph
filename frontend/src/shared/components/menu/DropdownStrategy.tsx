import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'

import type { MenuStrategy } from './menu-strategy.types'

/** A wide screen: a menu that opens beside its trigger. */
export const dropdownStrategy: MenuStrategy = {
  Root: ({ isOpen, onOpenChange, children }) => (
    <DropdownMenu
      {...(isOpen !== undefined && { open: isOpen })}
      {...(onOpenChange !== undefined && { onOpenChange })}
    >
      {children}
    </DropdownMenu>
  ),
  Trigger: ({ children }) => <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>,
  Content: ({ side, align, className, children }) => (
    <DropdownMenuContent
      {...(side !== undefined && { side })}
      {...(align !== undefined && { align })}
      {...(className !== undefined && { className })}
    >
      {children}
    </DropdownMenuContent>
  ),
  Item: ({ onSelect, variant, isDisabled, children }) => (
    <DropdownMenuItem
      {...(variant !== undefined && { variant })}
      {...(isDisabled !== undefined && { disabled: isDisabled })}
      onSelect={() => onSelect?.()}
    >
      {children}
    </DropdownMenuItem>
  ),
  Label: ({ children }) => <DropdownMenuLabel>{children}</DropdownMenuLabel>,
  Separator: () => <DropdownMenuSeparator />,
}
