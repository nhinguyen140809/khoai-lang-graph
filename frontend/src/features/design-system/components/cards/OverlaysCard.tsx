'use client'

import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/components/ui/alert-dialog'
import { Button } from '@/shared/components/ui/button'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from '@/shared/components/ui/context-menu'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/shared/components/ui/drawer'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/shared/components/ui/hover-card'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'

import { SampleCard } from '../Sample'

// One toast per status; each shows the icon and color of its status.
const toastSamples = [
  {
    label: 'Success toast',
    show: () => {
      toast.success('Specification v2 approved')
    },
  },
  {
    label: 'Info toast',
    show: () => {
      toast.info('The run paused at checkpoint_analysis')
    },
  },
  {
    label: 'Warning toast',
    show: () => {
      toast.warning('PER-002 ran out of turns before the last topic')
    },
  },
  {
    label: 'Error toast',
    show: () => {
      toast.error('Run 2 failed', { description: 'The cost reached the limit of $2.00.' })
    },
  },
]

export function OverlaysCard() {
  return (
    <SampleCard
      title="Overlays"
      description="Each button opens one kind of overlay."
      className="grid grid-cols-2 gap-2"
    >
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">Dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename the project</DialogTitle>
            <DialogDescription>The name shows in the project list.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline">Alert dialog</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Stop run 3?</AlertDialogTitle>
            <AlertDialogDescription>
              The open call to the model is closed. Items written so far stay.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep running</AlertDialogCancel>
            <AlertDialogAction variant="solid" color="destructive">
              Stop run
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline">Sheet</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Run settings</SheetTitle>
            <SheetDescription>Settings sent with the next message.</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="outline">Drawer</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Step 67, checkpoint_analysis</DrawerTitle>
            <DrawerDescription>Waiting for review since 10:42.</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Popover</Button>
        </PopoverTrigger>
        <PopoverContent className="text-xs">
          AMB-002 concerns REQ-001: the session length is not given.
        </PopoverContent>
      </Popover>
      <HoverCard>
        <HoverCardTrigger asChild>
          <Button variant="outline">Hover card</Button>
        </HoverCardTrigger>
        <HoverCardContent className="flex flex-col gap-1 text-xs">
          <span className="font-medium">PER-001 Student</span>
          <span className="text-muted-foreground">Second-year student who needs a mentor.</span>
        </HoverCardContent>
      </HoverCard>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Tooltip</Button>
        </TooltipTrigger>
        <TooltipContent>Retry from this step</TooltipContent>
      </Tooltip>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Dropdown menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>REQ-001</DropdownMenuLabel>
          <DropdownMenuItem>
            Open
            <DropdownMenuShortcut>Enter</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>Show trace</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ContextMenu>
        <ContextMenuTrigger className="flex h-16 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
          Right-click here
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>
            Copy key
            <ContextMenuShortcut>Ctrl C</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem>Open in a new tab</ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem variant="destructive">Delete</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      <Button
        variant="outline"
        className="h-16"
        onClick={() => {
          toast('Run 3 finished', { description: '38 requirements, 2 open issues.' })
        }}
      >
        Toast
      </Button>
      <div className="col-span-2 flex flex-wrap gap-2">
        {toastSamples.map(({ label, show }) => (
          <Button key={label} variant="outline" onClick={show}>
            {label}
          </Button>
        ))}
      </div>
    </SampleCard>
  )
}
