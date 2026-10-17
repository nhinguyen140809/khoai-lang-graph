'use client'

import { ErrorState } from '@/shared/components/state'

interface RouteErrorProps {
  error: Error
  retry: () => void
}

/** Error boundary for the screens of a project; the frame around them stays. */
export default function RouteError({ error, retry }: RouteErrorProps) {
  return <ErrorState message={error.message} onRetry={retry} />
}
