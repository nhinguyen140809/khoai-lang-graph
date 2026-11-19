import './styles.css'

import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import { Providers } from '@/providers/Providers'
import { pageTitleSeparator, siteTitle } from '@/shared/lib/title'

// The icon of the tab is `icon.svg` of this folder, which Next.js serves as the icon of the site.
export const metadata: Metadata = {
  // A page that names itself on the server gets "name | app"; the pages of a project name themselves
  // in the browser, with `usePageTitle`, once the project has loaded.
  icons: { icon: '/icon.svg' },
  title: { default: siteTitle, template: `%s${pageTitleSeparator}${siteTitle}` },
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
