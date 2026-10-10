'use client'

import type { Route } from 'next'
import { useRouter } from 'next/navigation'

import { CommandGroup, CommandItem } from '@/components/ui/command'

import {
  activityFooterItems,
  activityItems,
  featureHref,
  featureTabGroup,
} from './activity-bar.config'
import { useCommandPaletteStore } from './command-palette.store'
import { useEditorTabsStore } from './editor-tabs.store'
import { useFrameStore } from './frame.store'

interface FeatureCommandsProps {
  projectId: string
}

/** Commands that open each feature of the project, like the items of the activity bar. */
export function FeatureCommands({ projectId }: FeatureCommandsProps) {
  const router = useRouter()
  const lastHrefs = useEditorTabsStore((state) => state.lastHrefs)
  const setOpen = useCommandPaletteStore((state) => state.setOpen)
  const setSidePanelVisible = useFrameStore((state) => state.setSidePanelVisible)
  const features = [...activityItems, ...activityFooterItems].flatMap(({ feature, ...item }) =>
    feature === undefined ? [] : [{ ...item, feature }],
  )

  return (
    <CommandGroup heading="Go to">
      {features.map(({ label, icon: Icon, feature }) => (
        <CommandItem
          key={feature}
          value={`Go to ${label}`}
          onSelect={() => {
            setOpen(false)
            setSidePanelVisible(true)
            router.push(
              (lastHrefs[featureTabGroup(projectId, feature)] ??
                featureHref(projectId, feature)) as Route,
            )
          }}
        >
          <Icon aria-hidden />
          {label}
        </CommandItem>
      ))}
    </CommandGroup>
  )
}
