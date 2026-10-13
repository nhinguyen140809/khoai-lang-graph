'use client'

import { type ReactNode, useState } from 'react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

/** A part of a panel, shown in its own tab. */
export interface PanelSection {
  /** Unique in the panel. */
  id: string
  title: string
  /** Buttons at the right of the tabs while the section is shown, such as a filter. */
  actions?: ReactNode
  /** Fills the section, and scrolls itself when it flows. */
  content: ReactNode
}

interface PanelSectionsProps {
  sections: readonly PanelSection[]
  /** Buttons at the end of the row of tabs, after the actions of the section shown. */
  controls?: ReactNode
}

/**
 * The sections of a panel, one tab each, in a row at the top; the first section shows first. The
 * row ends with the actions of the section shown.
 */
export function PanelSections({ sections, controls }: PanelSectionsProps) {
  const [selected, setSelected] = useState(sections[0]?.id)
  const shown = sections.find(({ id }) => id === selected) ?? sections[0]

  if (shown === undefined) return null

  return (
    <Tabs value={shown.id} onValueChange={setSelected} className="h-full gap-0">
      <div className="flex shrink-0 items-center gap-1 pr-1">
        <TabsList variant="line" className="px-2">
          {sections.map(({ id, title }) => (
            <TabsTrigger key={id} value={id}>
              {title}
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="ml-auto flex items-center gap-0.5">
          {shown.actions}
          {controls}
        </div>
      </div>
      {sections.map(({ id, content }) => (
        <TabsContent key={id} value={id} className="min-h-0">
          {content}
        </TabsContent>
      ))}
    </Tabs>
  )
}
