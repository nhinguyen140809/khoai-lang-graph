'use client'

import { CommandGroup, CommandItem } from '@/components/ui/command'

import { useActivities } from '../activity-bar/ActivitiesContext'
import { isFeatureActivity } from '../activity-bar/activity.utils'
import { useFrameStore } from '../frame.store'
import { useCommandPaletteStore } from './command-palette.store'

/** Commands that show the side panel of each feature of the screen, like the activity bar. */
export function FeatureCommands() {
  const { activities } = useActivities()
  const setOpen = useCommandPaletteStore((state) => state.setOpen)
  const showSideFeature = useFrameStore((state) => state.showSideFeature)

  return (
    <CommandGroup heading="Show">
      {activities.filter(isFeatureActivity).map(({ id, label, icon }) => (
        <CommandItem
          key={id}
          value={`Show ${label}`}
          onSelect={() => {
            setOpen(false)
            showSideFeature(id)
          }}
        >
          <span aria-hidden className="flex">
            {icon}
          </span>
          {label}
        </CommandItem>
      ))}
    </CommandGroup>
  )
}
