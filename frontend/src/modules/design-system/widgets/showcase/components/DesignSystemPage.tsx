'use client'

import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'

import { sectionGroups, sections } from '../design-system.types'
import { useActiveSection } from '../hooks/useActiveSection'
import { useCardFocus } from '../hooks/useCardFocus'
import { DesignSystemSearch } from './DesignSystemSearch'
import { SectionCards } from './DesignSystemSections'
import { ThemeToggle } from './ThemeToggle'

const sectionIds = sections.map((section) => section.id)

/** Every component of src/shared/components/ui, as cards in tabs by purpose, to review the design system. */
export function DesignSystemPage() {
  const [active, select] = useActiveSection(sectionIds, 'foundations')
  const [focus, setFocus] = useCardFocus()

  return (
    <Tabs value={active} onValueChange={select} className="h-svh gap-0 bg-background">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b px-6 py-3">
        <div className="flex flex-col gap-0.5">
          <h1>Design system</h1>
          <p className="text-xs text-muted-foreground">
            shadcn/ui radix-nova | Night Owl surfaces | Mona Sans and Noto Sans Mono
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DesignSystemSearch
            onChoose={(card, section) => {
              select(section)
              setFocus(card)
            }}
          />
          <ThemeToggle />
        </div>
      </header>
      {/* One list per group, side by side; the row scrolls sideways when the window is too narrow. */}
      <div className="flex shrink-0 items-center gap-4 overflow-x-auto border-b px-6 py-2">
        {sectionGroups.map((group) => (
          <div key={group.id} className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{group.label}</span>
            <TabsList>
              {sections
                .filter((section) => section.group === group.id)
                .map(({ id, label }) => (
                  <TabsTrigger key={id} value={id} className="px-3">
                    {label}
                  </TabsTrigger>
                ))}
            </TabsList>
          </div>
        ))}
      </div>
      <ScrollArea className="min-h-0 flex-1">
        {sections.map(({ id }) => (
          <TabsContent key={id} value={id} className="flex flex-col gap-4 p-6">
            <SectionCards section={id} focus={focus} />
          </TabsContent>
        ))}
      </ScrollArea>
    </Tabs>
  )
}
