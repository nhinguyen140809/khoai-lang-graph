'use client'

import './styles.css'

import { ErrorState } from '@/shared/components/state'

interface GlobalErrorProps {
  error: Error
  retry: () => void
}

/**
 * The last error boundary, for an error of the root layout, such as its providers. It replaces the
 * root layout, so it renders the document itself, without the providers: it shows in the light
 * theme.
 */
export default function GlobalError({ error, retry }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body>
        <main className="flex min-h-svh items-center justify-center p-6">
          <ErrorState message={error.message} onRetry={retry} className="w-full max-w-md p-0" />
        </main>
      </body>
    </html>
  )
}
