'use client'

import { CommandGroup, CommandItem } from '@/components/ui/command'

import { activityFooterItems, activityItems } from './activity-bar.config'
import { useCommandPaletteStore } from './command-palette.store'
import { useFrameStore } from './frame.store'

/** Commands that show the side panel of each feature of the project, like the activity bar. */
export function FeatureCommands() {
  const setOpen = useCommandPaletteStore((state) => state.setOpen)
  const showSideFeature = useFrameStore((state) => state.showSideFeature)
  const features = [...activityItems, ...activityFooterItems].flatMap(({ feature, ...item }) =>
    feature === undefined ? [] : [{ ...item, feature }],
  )

  return (
    <CommandGroup heading="Show">
      {features.map(({ label, icon: Icon, feature }) => (
        <CommandItem
          key={feature}
          value={`Show ${label}`}
          onSelect={() => {
            setOpen(false)
            showSideFeature(feature)
          }}
        >
          <Icon aria-hidden />
          {label}
        </CommandItem>
      ))}
    </CommandGroup>
  )
}
