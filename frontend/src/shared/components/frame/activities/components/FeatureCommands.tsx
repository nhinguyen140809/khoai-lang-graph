'use client'

import { PaletteGroup } from '../../commands/command.constants'
import { useCommands } from '../../commands/hooks/useCommands'
import { isFeatureActivity } from '../activity.utils'
import { useActivities } from '../hooks/useActivities'
import { useSideFeature } from '../hooks/useSideFeature'

/**
 * Registers one command per feature of the screen that shows its side panel, like the activity
 * bar. Renders nothing.
 */
export function FeatureCommands() {
  const { activities } = useActivities()
  const { show } = useSideFeature()

  useCommands(
    activities.filter(isFeatureActivity).map(({ id, label, icon }) => ({
      id: `show.${id}`,
      label,
      group: PaletteGroup.Show,
      icon,
      run: () => {
        show(id)
      },
    })),
  )

  return null
}
