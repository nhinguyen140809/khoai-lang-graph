'use client'

import {
  ChevronRightIcon,
  CircleHelpIcon,
  LogOutIcon,
  MessageSquareIcon,
  RotateCcwIcon,
  UserIcon,
} from 'lucide-react'
import Link from 'next/link'
import { type ComponentProps, useMemo, useState } from 'react'

import { useLogout } from '@/modules/auth/features/logout'
import { type Me, useMe } from '@/modules/user/entities'
import { useActivityBarItem } from '@/shared/components/frame'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { Button } from '@/shared/components/ui/button'
import { ConfirmDialog } from '@/shared/components/ui/confirm-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { initialsOf } from '@/shared/lib/text'
import { routes } from '@/shared/routes'

/** Shows the account menu at the bottom of the activity bar while it is mounted. */
export function AccountMenuItem() {
  const content = useMemo(() => <UserMenu />, [])

  useActivityBarItem({ content })

  return null
}

/**
 * The account of the signed-in user, for the bottom of the activity bar: the user, who opens the
 * profile, then help, feedback and logging out, which asks first.
 */
export function UserMenu() {
  // The dialog sits beside the menu, since the menu closes when one of its items is chosen.
  const [confirmingLogout, setConfirmingLogout] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <AccountButton />
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="end" className="w-60">
          <AccountItem />
          <DropdownMenuSeparator />
          <SupportItems />
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => {
              setConfirmingLogout(true)
            }}
          >
            <LogOutIcon aria-hidden />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <LogoutDialog open={confirmingLogout} onOpenChange={setConfirmingLogout} />
    </>
  )
}

/** The picture of the user, or their initials without one. Hidden from assistive technology. */
function UserAvatar({ me }: { me: Me }) {
  return (
    <Avatar size="sm" aria-hidden>
      {me.avatar_url !== null && <AvatarImage src={me.avatar_url} alt="" />}
      <AvatarFallback>{initialsOf(me.display_name)}</AvatarFallback>
    </Avatar>
  )
}

/** The button that opens the menu: the avatar of the user, named after them. */
function AccountButton(props: ComponentProps<typeof Button>) {
  const me = useMe()

  return (
    <Button variant="ghost" size="icon-lg" className="rounded-full" {...props}>
      {me.isPending ? (
        <Skeleton className="size-6 rounded-full" />
      ) : me.isError ? (
        <UserIcon aria-hidden />
      ) : (
        <UserAvatar me={me.data} />
      )}
      <span className="sr-only">{me.isSuccess ? me.data.display_name : 'Account'}</span>
    </Button>
  )
}

/** The first item: the user, who opens the profile, or why they are not shown. */
function AccountItem() {
  const me = useMe()

  if (me.isPending) return <DropdownMenuItem disabled>Loading your account...</DropdownMenuItem>
  if (me.isError) {
    return (
      <DropdownMenuItem variant="destructive" onSelect={() => void me.refetch()}>
        <RotateCcwIcon aria-hidden />
        Failed to load your account. Try again
      </DropdownMenuItem>
    )
  }
  return (
    <DropdownMenuItem asChild>
      <Link href={routes.settings()}>
        <UserAvatar me={me.data} />
        <span className="flex min-w-0 flex-1 flex-col">
          {/* The spaces between the lines keep the words apart in the name of the item. */}
          <span className="sr-only">Your profile:</span>{' '}
          <span className="truncate font-bold">{me.data.display_name}</span>{' '}
          <span className="truncate text-muted-foreground">{me.data.email}</span>
        </span>
        <ChevronRightIcon aria-hidden />
      </Link>
    </DropdownMenuItem>
  )
}

/** Help and feedback, disabled until they exist. */
function SupportItems() {
  return (
    <>
      <DropdownMenuItem disabled>
        <CircleHelpIcon aria-hidden />
        Help
      </DropdownMenuItem>
      <DropdownMenuItem disabled>
        <MessageSquareIcon aria-hidden />
        Send feedback
      </DropdownMenuItem>
    </>
  )
}

interface LogoutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Asks before ending the session, and waits while it ends; a failure leaves it open. */
function LogoutDialog({ open, onOpenChange }: LogoutDialogProps) {
  const logoutRequest = useLogout()

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={<LogOutIcon />}
      title="Log out?"
      description="You will need to log in again to continue."
      confirmLabel="Log out"
      onConfirm={() => logoutRequest.mutateAsync()}
    />
  )
}
