'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { NotFoundState } from '@/shared/components/state'
import { Button } from '@/shared/ui/button'

export default function NotFound() {
  const pathname = usePathname()

  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <NotFoundState
        className="w-full max-w-md p-0"
        reference={pathname}
        description="No page exists at this address. Check the link, or go back to the app."
        action={
          <Button asChild>
            <Link href="/">Back to the app</Link>
          </Button>
        }
      />
    </main>
  )
}
