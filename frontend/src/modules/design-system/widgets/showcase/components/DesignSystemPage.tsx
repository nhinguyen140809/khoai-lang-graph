import { ScrollArea } from '@/shared/components/ui/scroll-area'

import { AlertsCard } from './cards/AlertsCard'
import { ArtifactTableCard } from './cards/ArtifactTableCard'
import { BadgesCard } from './cards/BadgesCard'
import { ButtonsCard } from './cards/ButtonsCard'
import { CalendarCard } from './cards/CalendarCard'
import { CarouselCard } from './cards/CarouselCard'
import { ChartCard } from './cards/ChartCard'
import { ChatCard } from './cards/ChatCard'
import { CodeCard } from './cards/CodeCard'
import { CommandCard } from './cards/CommandCard'
import { ControlsCard } from './cards/ControlsCard'
import { DisclosureCard } from './cards/DisclosureCard'
import { ExplorerTreeCard } from './cards/ExplorerTreeCard'
import { FormCard } from './cards/FormCard'
import { GraphCard } from './cards/GraphCard'
import { ItemsCard } from './cards/ItemsCard'
import { MarkdownCard } from './cards/MarkdownCard'
import { NavigationCard } from './cards/NavigationCard'
import { NumbersCard } from './cards/NumbersCard'
import { OverlaysCard } from './cards/OverlaysCard'
import { ReviewCard } from './cards/ReviewCard'
import { SkeletonCard } from './cards/SkeletonCard'
import { TokensCard } from './cards/TokensCard'
import { TypographyCard } from './cards/TypographyCard'
import { WorkspaceCard } from './cards/WorkspaceCard'
import { ThemeToggle } from './ThemeToggle'

/** Every component of src/shared/components/ui on one page, as cards, to review the design system. */
export function DesignSystemPage() {
  return (
    // The header stays at the top and the cards scroll below it, in a ScrollArea instead of the
    // native page scroll.
    <div className="flex h-svh flex-col bg-background">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b px-6 py-3">
        <div className="flex flex-col gap-0.5">
          <h1>Design system</h1>
          <p className="text-xs text-muted-foreground">
            shadcn/ui radix-nova | Night Owl surfaces | Mona Sans and Noto Sans Mono
          </p>
        </div>
        <ThemeToggle />
      </header>
      <ScrollArea className="min-h-0 flex-1">
        <main className="flex flex-col gap-4 p-6">
          <WorkspaceCard />
          <div className="columns-1 gap-4 *:mb-4 *:break-inside-avoid md:columns-2 xl:columns-3 2xl:columns-4">
            <TokensCard />
            <TypographyCard />
            <ChartCard />
            <ReviewCard />
            <ButtonsCard />
            <BadgesCard />
            <CodeCard />
            <AlertsCard />
            <FormCard />
            <NumbersCard />
            <ExplorerTreeCard />
            <GraphCard />
            <ArtifactTableCard />
            <ChatCard />
            <MarkdownCard />
            <ControlsCard />
            <OverlaysCard />
            <NavigationCard />
            <DisclosureCard />
            <ItemsCard />
            <CommandCard />
            <CalendarCard />
            <CarouselCard />
            <SkeletonCard />
          </div>
        </main>
      </ScrollArea>
    </div>
  )
}
