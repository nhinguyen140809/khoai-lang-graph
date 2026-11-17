'use client'

import { cn } from 'cn'
import type { ComponentType } from 'react'

import { useUserSettings } from '@/modules/user/entities'
import { CardStack } from '@/shared/components/animation'
import { Badge } from '@/shared/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'
import { useView } from '@/shared/lib/view'
import { useViewStartHref } from '@/shared/routes'

import { layoutChoiceMessages, layoutOptions } from './layout-choice.constants'
import type { FigureArrangement, LayoutOption } from './layout-choice.types'
import { useChooseView } from './useChooseView'

type Figures = LayoutOption['figures']

/** One picture, playing, in the middle of the box, with its name under it. */
function SingleFigures({ figures }: { figures: Figures }) {
  return (
    <div className="flex w-full max-w-72 flex-col gap-4 py-3.5">
      {figures.map(({ label, sketch: Sketch }) => (
        <figure key={label}>
          <Sketch className="w-full" isPlaying />
          <figcaption className="mt-2 text-center text-xs">{label}</figcaption>
        </figure>
      ))}
    </div>
  )
}

/** Several pictures in a pile that turns: the one in front plays, and the others wait behind it. */
function StackedFigures({ figures }: { figures: Figures }) {
  return (
    <div className="w-full max-w-96">
      <CardStack
        items={figures.map(({ label, sketch: Sketch }) => ({
          label,
          render: (isFront) => <Sketch className="w-full" isPlaying={isFront} once />,
        }))}
      />
    </div>
  )
}

/** How the pictures of a layout sit in the box of its card: the record is the strategy. */
const figureArrangements = {
  single: SingleFigures,
  stack: StackedFigures,
} satisfies Record<FigureArrangement, ComponentType<{ figures: Figures }>>

interface LayoutChoiceProps {
  /** Marks the layout on show as the current one, not the one saved in the settings. */
  marksViewOnShow?: boolean
}

/**
 * The choice of the layout of the app: a card for each view with a sketch of its layout and a line
 * on who it is for. Choosing a card saves the choice in the settings of the user and opens the
 * start page of that view, on the host that shows it.
 */
export function LayoutChoice({ marksViewOnShow = false }: LayoutChoiceProps) {
  const chooseView = useChooseView()
  const startHref = useViewStartHref()
  const shown = useView()
  const saved = useUserSettings().data?.preferred_view
  const chosen = marksViewOnShow ? shown : saved

  return (
    <ul className="grid gap-6 md:grid-cols-2">
      {layoutOptions.map(({ view, title, description, arrangement, figures }) => {
        const isChosen = chosen === view
        const Figures = figureArrangements[arrangement]
        return (
          <li key={view} className="flex">
            {/* The other view is on another host, so the choice is saved first and the link is followed once it is. */}
            <a
              href={startHref(view)}
              onClick={(event) => {
                event.preventDefault()
                if (!chooseView.isPending) chooseView.mutate({ view, href: startHref(view) })
              }}
              aria-current={isChosen ? 'true' : undefined}
              aria-busy={chooseView.isPending}
              className="group flex w-full rounded-xl outline-none aria-busy:opacity-60"
            >
              <Card
                className={cn(
                  'w-full transition-colors group-hover:ring-ring group-focus-visible:ring-2 group-focus-visible:ring-ring motion-reduce:transition-none',
                  isChosen && 'ring-ring',
                )}
              >
                <CardContent>
                  <div className="flex min-h-64 items-center justify-center rounded-lg bg-muted/40 p-5 text-muted-foreground transition-colors group-hover:text-primary motion-reduce:transition-none">
                    <Figures figures={figures} />
                  </div>
                </CardContent>
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-lg font-semibold">{title}</CardTitle>
                    {isChosen && (
                      <Badge variant="soft" color="primary" className="border-(--tone-border)">
                        {layoutChoiceMessages.current}
                      </Badge>
                    )}
                  </div>
                  <CardDescription>{description}</CardDescription>
                </CardHeader>
              </Card>
            </a>
          </li>
        )
      })}
    </ul>
  )
}
