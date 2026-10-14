'use client'

import { useMutation } from '@tanstack/react-query'
import { LogOutIcon, RotateCcwIcon, SettingsIcon, UserIcon } from 'lucide-react'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'

import { ApiError, HttpStatus } from '@/shared/api/api-fetch.utils'
import { AuthPage, loadPage } from '@/shared/api/auth-redirect.utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { useIsHydrated } from '@/shared/hooks/useIsHydrated'

import { logout } from '../account.api'
import { initials } from '../account.utils'
import { useMe } from '../hooks/useMe'

const themeOptions = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
]

/** The account of the signed-in user, the theme, and signing out, for the bottom of the activity bar. */
export function UserMenu() {
  const me = useMe()
  const { theme, setTheme } = useTheme()
  // The stored theme is only known in the browser; until hydration no option is marked.
  const hydrated = useIsHydrated()
  const signOut = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      // A full page load: the data of this session must not show to whoever signs in next.
      loadPage(AuthPage.Login)
    },
    onError: (error) => {
      // Without a session the query client already opens the sign-in page.
      if (error instanceof ApiError && error.status === HttpStatus.Unauthorized) return
      toast.error(error.message)
    },
  })

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-lg" className="rounded-full">
          {me.isPending ? (
            <Skeleton className="size-6 rounded-full" />
          ) : me.isError ? (
            <UserIcon aria-hidden />
          ) : (
            <Avatar size="sm" aria-hidden>
              {me.data.avatar_url !== null && <AvatarImage src={me.data.avatar_url} alt="" />}
              <AvatarFallback>{initials(me.data.display_name)}</AvatarFallback>
            </Avatar>
          )}
          <span className="sr-only">
            {me.isSuccess ? `Account of ${me.data.display_name}` : 'Account'}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="end" className="w-56">
        {me.isPending && <DropdownMenuItem disabled>Loading your account...</DropdownMenuItem>}
        {me.isError && (
          <DropdownMenuItem onSelect={() => void me.refetch()}>
            <RotateCcwIcon aria-hidden />
            Failed to load your account. Try again
          </DropdownMenuItem>
        )}
        {me.isSuccess && (
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="text-foreground">{me.data.display_name}</span>
            <span className="truncate font-normal">{me.data.email}</span>
          </DropdownMenuLabel>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <SettingsIcon aria-hidden />
            Your settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={hydrated ? (theme ?? '') : ''}
          onValueChange={(value) => {
            setTheme(value)
          }}
        >
          {themeOptions.map(({ value, label }) => (
            <DropdownMenuRadioItem key={value} value={value}>
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={signOut.isPending}
          onSelect={() => {
            signOut.mutate()
          }}
        >
          <LogOutIcon aria-hidden />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
