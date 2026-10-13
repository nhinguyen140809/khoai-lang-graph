import { useContext } from 'react'

import { ActivitiesContext } from '../ActivitiesContext'

/** The features of the screen and the icons of their tabs, which Workbench provides. */
export function useActivities() {
  return useContext(ActivitiesContext)
}
