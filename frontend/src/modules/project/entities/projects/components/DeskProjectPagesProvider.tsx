'use client'

import type { ReactNode } from 'react'

import { deskProjectPages } from '../projects.constants'
import { ProjectPagesProvider } from './ProjectPagesProvider'

/**
 * Says to the parts under it that a project opens on its chat and starts on the start page, as the
 * desk shows them, such as the dialog that creates a project and then opens it. The layout of the
 * user view, a Server Component that cannot hand functions to the client, places it.
 */
export function DeskProjectPagesProvider({ children }: { children: ReactNode }) {
  return <ProjectPagesProvider pages={deskProjectPages}>{children}</ProjectPagesProvider>
}
