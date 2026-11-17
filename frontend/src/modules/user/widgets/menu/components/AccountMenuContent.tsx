'use client'

import {
  ChevronRightIcon,
  CircleHelpIcon,
  LogOutIcon,
  MessageSquareIcon,
  RotateCcwIcon,
} from 'lucide-react'
import Link from 'next/link'
import type { ComponentProps, ReactNode } from 'react'

import { useLogout } from '@/modules/auth/features/logout'
import { type Me, useMe } from '@/modules/user/entities'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { ConfirmDialog } from '@/shared/components/ui/confirm-dialog'
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/shared/components/ui/dropdown-menu'
import { initialsOf } from '@/shared/lib/text'
import { routes } from '@/shared/routes'

import { userMenuMessages } from '../user-menu.constants'

interface AccountMenuContentProps extends Pick<
  ComponentProps<typeof DropdownMenuContent>,
  'side' | 'align' | 'className'
> {
  /** Opens the dialog that asks before logging out, which sits beside the menu. */
  onLogout: () => void
  /** Items under the user, before help and feedback, such as Settings. */
  children?: ReactNode
}

/**
 * The items of the account menu, which every form of the menu shows: the user, who opens the
 * profile, the items the form adds, then help, feedback and logging out, which asks first.
 */
export function AccountMenuContent({
  onLogout,
  children,
  ...contentProps
}: AccountMenuContentProps) {
  return (
    <DropdownMenuContent {...contentProps}>
      <AccountItem />
      <DropdownMenuSeparator />
      {children}

      <SupportItems />
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={onLogout}>
        <LogOutIcon aria-hidden />
        {userMenuMessages.logout}
      </DropdownMenuItem>
    </DropdownMenuContent>
  )
}

/** The picture of the user, or their initials without one. Hidden from assistive technology. */
export function UserAvatar({ me }: { me: Me }) {
  return (
    <Avatar size="sm" aria-hidden>
      {me.avatar_url !== null && <AvatarImage src={me.avatar_url} alt="" />}
      <AvatarFallback>{initialsOf(me.display_name)}</AvatarFallback>
    </Avatar>
  )
}

/** The first item: the user, who opens the profile, or why they are not shown. */
function AccountItem() {
  const me = useMe()

  if (me.isPending) return <DropdownMenuItem disabled>{userMenuMessages.loading}</DropdownMenuItem>
  if (me.isError) {
    return (
      <DropdownMenuItem variant="destructive" onSelect={() => void me.refetch()}>
        <RotateCcwIcon aria-hidden />
        {userMenuMessages.loadFailed}
      </DropdownMenuItem>
    )
  }
  return (
    <DropdownMenuItem asChild>
      <Link href={routes.settings()}>
        <UserAvatar me={me.data} />
        <span className="flex min-w-0 flex-1 flex-col">
          {/* The spaces between the lines keep the words apart in the name of the item. */}
          <span className="sr-only">{userMenuMessages.profile}</span>{' '}
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
        {userMenuMessages.help}
      </DropdownMenuItem>
      <DropdownMenuItem disabled>
        <MessageSquareIcon aria-hidden />
        {userMenuMessages.feedback}
      </DropdownMenuItem>
    </>
  )
}

interface LogoutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Asks before ending the session, and waits while it ends; a failure leaves it open. */
export function LogoutDialog({ open, onOpenChange }: LogoutDialogProps) {
  const logoutRequest = useLogout()

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={<LogOutIcon />}
      title={userMenuMessages.logoutTitle}
      description={userMenuMessages.logoutDescription}
      confirmLabel={userMenuMessages.logout}
      onConfirm={() => logoutRequest.mutateAsync()}
    />
  )
}
