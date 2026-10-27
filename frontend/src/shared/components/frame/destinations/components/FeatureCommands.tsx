'use client'

import { PaletteGroup } from '../../commands/command.constants'
import { useCommands } from '../../commands/hooks/useCommands'
import { isFeatureDestination } from '../destination.utils'
import { useDestinations } from '../hooks/useDestinations'
import { useSideFeature } from '../hooks/useSideFeature'

/**
 * Registers one command per feature of the screen that shows its side panel, like the activity
 * bar. Renders nothing.
 */
export function FeatureCommands() {
  const { destinations } = useDestinations()
  const { show } = useSideFeature()

  useCommands(
    destinations.filter(isFeatureDestination).map(({ id, label, icon }) => ({
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
