'use client'

import { ErrorState } from '@/components/state'

interface RouteErrorProps {
  error: Error
  reset: () => void
}

/** Error boundary for the screens of a project; the frame around them stays. */
export default function RouteError({ error, reset }: RouteErrorProps) {
  return <ErrorState message={error.message} onRetry={reset} />
}
