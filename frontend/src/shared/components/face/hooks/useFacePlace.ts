'use client'

import { use } from 'react'

import { FacePlacesContext } from '../FacePlacesContext'

/** The place of an agent in its workflow: the one given, else its index among the seeds of the provider above, else none. */
export function useFacePlace(seed: string, place?: number): number | undefined {
  const seeds = use(FacePlacesContext)
  if (place !== undefined) return place
  const found = seeds.indexOf(seed)
  return found < 0 ? undefined : found
}
