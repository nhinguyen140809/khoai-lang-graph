'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { LogOutIcon, RotateCcwIcon, UserIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { useIsHydrated } from '@/hooks/useIsHydrated'

import { logout } from '../account.api'
import { useMe } from '../hooks/useMe'

const themeOptions = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
]

function initials(name: string): string {
  const letters = name
    .split(/\s+/)
    .filter((word) => word !== '')
    .map((word) => word.charAt(0).toUpperCase())
  return (
    (letters.length > 1 ? `${letters[0] ?? ''}${letters.at(-1) ?? ''}` : (letters[0] ?? '')) || '?'
  )
}

/** The account of the signed-in user, the theme, and signing out, at the bottom of the activity bar. */
export function UserMenu() {
  const me = useMe()
  const { theme, setTheme } = useTheme()
  // The stored theme is only known in the browser; until hydration no option is marked.
  const hydrated = useIsHydrated()
  const router = useRouter()
  const queryClient = useQueryClient()
  const signOut = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      router.replace('/login')
      // The data of this session must not show to whoever signs in next on this page.
      queryClient.clear()
    },
    onError: (error) => {
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
            <Avatar size="sm">
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
