'use client'

import { SettingsIcon, UserIcon } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { useMe } from '@/modules/user/entities'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { routes } from '@/shared/routes'

import { userMenuMessages } from '../user-menu.constants'
import { AccountMenuContent, LogoutDialog, UserAvatar } from './AccountMenuContent'

/**
 * The account of the signed-in user, for the end of the bar at the top: the avatar of the user,
 * whose menu opens below it and shows the email, with Settings beside the items of
 * `AccountMenuContent`.
 * @view user
 */
export function BarAccountMenu() {
  const me = useMe()
  // The dialog sits beside the menu, since the menu closes when one of its items is chosen.
  const [confirmingLogout, setConfirmingLogout] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" className="rounded-full">
            <span className="sr-only">{userMenuMessages.account}</span>
            {me.isPending && <Skeleton className="size-6 rounded-full" />}
            {me.isError && <UserIcon aria-hidden />}
            {me.isSuccess && <UserAvatar me={me.data} />}
          </Button>
        </DropdownMenuTrigger>
        <AccountMenuContent
          side="bottom"
          align="end"
          className="w-60"
          onLogout={() => {
            setConfirmingLogout(true)
          }}
        >
          <DropdownMenuItem asChild>
            <Link href={routes.settings()}>
              <SettingsIcon aria-hidden />
              {userMenuMessages.settings}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
        </AccountMenuContent>
      </DropdownMenu>
      <LogoutDialog open={confirmingLogout} onOpenChange={setConfirmingLogout} />
    </>
  )
}
