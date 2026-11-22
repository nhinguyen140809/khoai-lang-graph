'use client'

import { createContext } from 'react'

/** The seeds of the agents of the workflow, in the order that it lists them: an agent's place is its index here. Empty until a provider gives them. */
export const FacePlacesContext = createContext<readonly string[]>([])
