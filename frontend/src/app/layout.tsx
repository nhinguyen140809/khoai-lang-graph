import './styles.css'

import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import { Providers } from '@/providers/Providers'

export const metadata: Metadata = {
  title: 'Khoailanggraph',
  icons: { icon: '/favicon.svg' },
}

interface RootLayoutProps {
  children: ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    // next-themes sets the theme class on <html> before hydration, so the attributes differ.
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
