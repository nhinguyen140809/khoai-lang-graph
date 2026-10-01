'use client'

import { ErrorState } from '@/components/state'

interface RouteErrorProps {
  error: Error
  reset: () => void
}

/** Error boundary for every route inside the app shell. */
export default function RouteError({ error, reset }: RouteErrorProps) {
  return <ErrorState message={error.message} onRetry={reset} />
}
