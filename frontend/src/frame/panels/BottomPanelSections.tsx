'use client'

import { Activity, type ReactNode, useState } from 'react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'

/** A part of the panel under the editor, shown in its own tab. */
export interface BottomPanelSection {
  /** Unique in the panel. */
  id: string
  title: string
  /** Buttons at the right of the tabs while the section is shown, such as a filter. */
  actions?: ReactNode
  /** Fills the section, and scrolls itself when it flows. */
  content: ReactNode
}

interface BottomPanelSectionsProps {
  sections: readonly BottomPanelSection[]
  /** Buttons at the end of the row of tabs, after the actions of the section shown. */
  controls?: ReactNode
}

/**
 * The sections of the panel under the editor, one tab each, in a row at the top; the first section
 * shows first. The row ends with the actions of the section shown. A section that another one
 * replaces on screen is hidden, not unmounted, so it keeps its state, such as where it was scrolled
 * to.
 */
export function BottomPanelSections({ sections, controls }: BottomPanelSectionsProps) {
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
        <TabsContent key={id} value={id} forceMount hidden={id !== shown.id} className="min-h-0">
          <Activity mode={id === shown.id ? 'visible' : 'hidden'}>{content}</Activity>
        </TabsContent>
      ))}
    </Tabs>
  )
}
