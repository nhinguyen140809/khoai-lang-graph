'use client'

import { createContext, useContext } from 'react'

/** The id of the project whose screen is on show; null outside the screens of a project. */
export const ProjectIdContext = createContext<string | null>(null)

/**
 * The id of the project whose screen the caller is part of. The pages and the widgets that a
 * route opens take the id as a prop and pass it to the queries; the parts inside them read it here
 * instead of receiving it through every level. The features and entities of the modules below
 * the project take the id as an argument. It throws outside the screens of a project, where no
 * project is meant.
 */
export function useProjectId(): string {
  const projectId = useContext(ProjectIdContext)
  if (projectId === null) {
    throw new Error('useProjectId reads the project of a screen: render the caller inside it.')
  }
  return projectId
}
