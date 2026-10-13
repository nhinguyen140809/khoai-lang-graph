'use client'

import { ErrorState } from '@/shared/components/state'

interface RouteErrorProps {
  error: Error
  reset: () => void
}

/** Error boundary for the screens outside a project. */
export default function RouteError({ error, reset }: RouteErrorProps) {
  return <ErrorState message={error.message} onRetry={reset} />
}
