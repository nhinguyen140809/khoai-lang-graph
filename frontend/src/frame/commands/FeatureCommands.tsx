'use client'

import { useActivities } from '../activities/ActivitiesContext'
import { isFeatureActivity } from '../activities/activity.utils'
import { useFrameStore } from '../frame.store'
import { PaletteGroup } from './command.constants'
import { useCommands } from './hooks/useCommands'

/**
 * Registers one command per feature of the screen that shows its side panel, like the activity
 * bar. Renders nothing.
 */
export function FeatureCommands() {
  const { activities } = useActivities()
  const showSideFeature = useFrameStore((state) => state.showSideFeature)

  useCommands(
    activities.filter(isFeatureActivity).map(({ id, label, icon }) => ({
      id: `show.${id}`,
      label,
      group: PaletteGroup.Show,
      icon,
      run: () => {
        showSideFeature(id)
      },
    })),
  )

  return null
}
