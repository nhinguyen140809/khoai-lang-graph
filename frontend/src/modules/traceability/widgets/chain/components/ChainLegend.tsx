'use client'

import { InfoIcon } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { EdgeSample } from '@/shared/components/ui/edge'
import { FloatingSurface } from '@/shared/components/ui/floating-surface'
import { Node } from '@/shared/components/ui/node'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover'
import { useModifierKeyName } from '@/shared/lib/hotkey'

import { chainEdgeLooks, chainNodeLegendRows, itemTraceMessages } from '../item-trace.constants'
import { chainNodeProps } from '../item-trace.utils'

/**
 * The legend of the page, over the top right corner of the canvas, behind an information button:
 * how to read the graph, how to move in it, the fills of the items and the looks of the lines.
 */
export function ChainLegend() {
  const modifierKey = useModifierKeyName()
  return (
    <FloatingSurface corner="top-right" variant="popover" size="sm" className="p-1">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon-sm" className="text-muted-foreground">
            <InfoIcon aria-hidden />
            <span className="sr-only">{itemTraceMessages.legendButton}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="max-h-(--radix-popover-content-available-height) w-160 overflow-y-auto"
        >
          <p className="text-sm">{itemTraceMessages.description}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {itemTraceMessages.moving(modifierKey)}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-6">
            <section>
              <h4 className="mb-2 text-xs font-semibold text-muted-foreground">
                {itemTraceMessages.legendNodes}
              </h4>
              <ul className="space-y-3">
                {chainNodeLegendRows.map(({ key, state }) => (
                  <li key={key} className="flex items-center gap-3">
                    <Node {...chainNodeProps(state)} className="h-5 w-10 shrink-0" />
                    <span className="text-sm">{itemTraceMessages.nodeLegend[key]}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <h4 className="mb-2 text-xs font-semibold text-muted-foreground">
                {itemTraceMessages.legendLines}
              </h4>
              <ul className="space-y-3">
                {(['act', 'follow', 'none', 'quiet'] as const).map((level) => (
                  <li key={level} className="flex items-center gap-3">
                    <EdgeSample {...chainEdgeLooks[level]} />
                    <span className="text-sm">{itemTraceMessages.legend[level]}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </PopoverContent>
      </Popover>
    </FloatingSurface>
  )
}
