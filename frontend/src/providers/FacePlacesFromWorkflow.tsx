'use client'

import type { ReactNode } from 'react'

import { useAgentRoleKeys } from '@/modules/workflow/entities'
import { FacePlacesProvider } from '@/shared/components/face'

/** Gives the faces the agents of the workflow in the order it lists them, so that each agent has its own face. */
export function FacePlacesFromWorkflow({ children }: { children: ReactNode }) {
  return <FacePlacesProvider seeds={useAgentRoleKeys()}>{children}</FacePlacesProvider>
}
