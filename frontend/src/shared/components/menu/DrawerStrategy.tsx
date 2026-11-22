import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/shared/components/ui/drawer'

import type { MenuStrategy } from './menu-strategy.types'

/** A narrow screen: a sheet that rises from the foot of the screen, with rows made for a finger. */
export const drawerStrategy: MenuStrategy = {
  Root: ({ isOpen, onOpenChange, children }) => (
    <Drawer
      {...(isOpen !== undefined && { open: isOpen })}
      {...(onOpenChange !== undefined && { onOpenChange })}
    >
      {children}
    </Drawer>
  ),
  Trigger: ({ children }) => <DrawerTrigger asChild>{children}</DrawerTrigger>,
  Content: ({ title, children }) => (
    <DrawerContent>
      <DrawerHeader className="sr-only">
        <DrawerTitle>{title}</DrawerTitle>
        <DrawerDescription>{title}</DrawerDescription>
      </DrawerHeader>
      <div role="menu" aria-label={title} className="flex flex-col gap-1 p-2 pb-6">
        {children}
      </div>
    </DrawerContent>
  ),
  Item: ({ onSelect, variant = 'default', isDisabled = false, children }) => (
    <DrawerClose asChild>
      <button
        type="button"
        role="menuitem"
        data-variant={variant}
        disabled={isDisabled}
        onClick={() => onSelect?.()}
        className="flex h-11 w-full items-center gap-3 rounded-md px-3 text-left text-sm outline-hidden select-none focus-visible:bg-accent active:bg-accent disabled:pointer-events-none disabled:opacity-50 data-[variant=destructive]:text-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5 data-[variant=destructive]:*:[svg]:text-destructive"
      >
        {children}
      </button>
    </DrawerClose>
  ),
  Label: ({ children }) => <p className="px-3 pt-2 text-xs text-muted-foreground">{children}</p>,
  Separator: () => <div role="separator" className="my-1 h-px bg-border" />,
}
