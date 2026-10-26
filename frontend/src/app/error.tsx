'use client'

import { ErrorState } from '@/shared/components/state'

interface RootErrorProps {
  error: Error
  retry: () => void
}

/**
 * Error boundary for the frames of the screens, which the layouts render, and for the pages that
 * have no boundary of their own, such as the login page. The frame may be what failed, so the
 * error stands alone on the page.
 */
export default function RootError({ error, retry }: RootErrorProps) {
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <ErrorState message={error.message} onRetry={retry} className="w-full max-w-md p-0" />
    </main>
  )
}
