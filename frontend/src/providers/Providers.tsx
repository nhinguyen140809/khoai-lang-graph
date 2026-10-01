'use client'

import { ThemeProvider } from 'next-themes'
import type { ReactNode } from 'react'

import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

import { MockingProvider } from './MockingProvider'
import { QueryProvider } from './QueryProvider'

interface ProvidersProps {
  children: ReactNode
}

/**
 * App-wide context providers, composed in order. Each provider with its own setup lives in its
 * own file in this folder; add new global providers here, not in app/layout.tsx.
 */
export function Providers({ children }: ProvidersProps) {
  return (
    // ThemeProvider stays outermost: its theme script must be part of the server-rendered HTML.
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <MockingProvider>
        <QueryProvider>
          <TooltipProvider>
            {children}
            <Toaster />
          </TooltipProvider>
        </QueryProvider>
      </MockingProvider>
    </ThemeProvider>
  )
}
