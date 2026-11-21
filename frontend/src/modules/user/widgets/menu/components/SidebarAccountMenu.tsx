'use client'

import { ChevronsUpDownIcon, SettingsIcon, UserIcon } from 'lucide-react'
import Link from 'next/link'
import { type ComponentProps, type ComponentType, useState } from 'react'

import { useMe } from '@/modules/user/entities'
import { DirectionalSwap } from '@/shared/components/animation'
import { type SidebarLayout, useSidebarLayout } from '@/shared/components/frame'
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/shared/components/ui/sidebar'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { routes } from '@/shared/routes'

import { userMenuMessages } from '../user-menu.constants'
import { AccountMenuContent, LogoutDialog, UserAvatar } from './AccountMenuContent'

/**
 * The account of the signed-in user, for the bottom of the side list: a row across its width with
 * the avatar and the name of the user, whose menu opens above it, as wide as the row, and shows the
 * email.
 * Beside the items of `AccountMenuContent` it offers Settings. On the rail of a folded side list
 * the row is the avatar alone.
 */
export function SidebarAccountMenu() {
  // The dialog sits beside the menu, since the menu closes when one of its items is chosen.
  const [confirmingLogout, setConfirmingLogout] = useState(false)

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <AccountRow />
            </DropdownMenuTrigger>
            <AccountMenuContent
              side="top"
              align="start"
              className="w-(--radix-dropdown-menu-trigger-width) min-w-60"
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
        </SidebarMenuItem>
      </SidebarMenu>
      <LogoutDialog open={confirmingLogout} onOpenChange={setConfirmingLogout} />
    </>
  )
}

interface AccountContentProps {
  /** The signed-in user, or why they are not shown. */
  me: ReturnType<typeof useMe>
}

/** The layouts of the row, one for each way the side list shows: the record is the strategy. */
const accountLayouts = {
  expanded: ExpandedAccount,
  rail: RailAccount,
} satisfies Record<SidebarLayout, ComponentType<AccountContentProps>>

/**
 * The row that opens the menu, laid out as the side list is: the avatar and the name of the user,
 * or their state, on a side list that is open, and the avatar alone, in the middle, on its rail.
 * The two layouts cross while the side list moves.
 */
function AccountRow(props: ComponentProps<typeof SidebarMenuButton>) {
  const me = useMe()
  const layout = useSidebarLayout()
  const Layout = accountLayouts[layout]

  return (
    <SidebarMenuButton
      tooltip={userMenuMessages.account}
      // The rail keeps no padding of its own, so that the avatar sits in the middle of the button.
      className="group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0!"
      {...props}
    >
      <DirectionalSwap swapKey={layout} enter="fade" exit="fade" className="w-full">
        <Layout me={me} />
      </DirectionalSwap>
    </SidebarMenuButton>
  )
}

/** The picture of the user, a placeholder while they load, or an icon when they failed to. */
function AccountPicture({ me }: AccountContentProps) {
  if (me.isPending) return <Skeleton className="size-6 shrink-0 rounded-full" />
  if (me.isError) return <UserIcon aria-hidden />
  return <UserAvatar me={me.data} />
}

/** The side list is open: the avatar, the name, and the arrows of the menu. */
function ExpandedAccount({ me }: AccountContentProps) {
  return (
    <span className="flex items-center gap-2">
      <AccountPicture me={me} />
      <span className="min-w-0 flex-1 truncate font-bold">
        {me.isSuccess ? me.data.display_name : userMenuMessages.account}
      </span>
      <ChevronsUpDownIcon aria-hidden className="ml-auto size-4 text-muted-foreground" />
    </span>
  )
}

/** The rail: the avatar alone, in the middle. */
function RailAccount({ me }: AccountContentProps) {
  return (
    <span className="flex items-center justify-center">
      <AccountPicture me={me} />
    </span>
  )
}
