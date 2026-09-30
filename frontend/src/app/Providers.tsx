import type { ReactNode } from 'react'

import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ThemeProvider, useResolvedTheme } from '@/features/settings'

import { QueryProvider } from './providers/QueryProvider'

interface ProvidersProps {
  children: ReactNode
}

/**
 * App-wide context providers, composed in order. Each provider with its own setup lives in
 * app/providers/; add new global providers here, not in App.tsx.
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <QueryProvider>
      <ThemeProvider>
        <TooltipProvider>
          {children}
          <ThemedToaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryProvider>
  )
}

function ThemedToaster() {
  const theme = useResolvedTheme()
  return <Toaster theme={theme} />
}
