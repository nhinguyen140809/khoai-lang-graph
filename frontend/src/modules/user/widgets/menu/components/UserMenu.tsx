'use client'

import { UserIcon } from 'lucide-react'
import { type ComponentProps, useMemo, useState } from 'react'

import { useMe } from '@/modules/user/entities'
import { useActivityBarItem } from '@/shared/components/frame'
import { Button } from '@/shared/components/ui/button'
import { DropdownMenu, DropdownMenuTrigger } from '@/shared/components/ui/dropdown-menu'
import { Skeleton } from '@/shared/components/ui/skeleton'

import { userMenuMessages } from '../user-menu.constants'
import { AccountMenuContent, LogoutDialog, UserAvatar } from './AccountMenuContent'

/** Shows the account menu at the bottom of the activity bar while it is mounted. */
export function AccountMenuItem() {
  const content = useMemo(() => <UserMenu />, [])

  useActivityBarItem({ content })

  return null
}

/**
 * The account of the signed-in user, for the bottom of the activity bar: the avatar of the user,
 * whose menu opens at its right with the items of `AccountMenuContent`.
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
        <AccountMenuContent
          side="right"
          align="end"
          className="w-60"
          onLogout={() => {
            setConfirmingLogout(true)
          }}
        />
      </DropdownMenu>
      <LogoutDialog open={confirmingLogout} onOpenChange={setConfirmingLogout} />
    </>
  )
}

/** The button that opens the menu: the avatar of the user, named after them. */
function AccountButton(props: ComponentProps<typeof Button>) {
  const me = useMe()

  return (
    <Button variant="ghost" size="icon-lg" className="rounded-full" {...props}>
      <AccountMark me={me} />
      <span className="sr-only">
        {me.isSuccess ? me.data.display_name : userMenuMessages.account}
      </span>
    </Button>
  )
}

/** What the account button shows: a placeholder while the user loads, a plain icon if it fails. */
function AccountMark({ me }: { me: ReturnType<typeof useMe> }) {
  if (me.isPending) return <Skeleton className="size-6 rounded-full" />
  if (me.isError) return <UserIcon aria-hidden />
  return <UserAvatar me={me.data} />
}
