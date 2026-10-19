import { useContext } from 'react'

import { DestinationsContext } from '../DestinationsContext'

/** The features of the screen and the icons of their tabs, which Workbench provides. */
export function useDestinations() {
  return useContext(DestinationsContext)
}
