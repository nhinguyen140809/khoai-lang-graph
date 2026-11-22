'use client'

import { ArrowUpIcon } from 'lucide-react'
import { Fragment } from 'react'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/shared/components/ui/breadcrumb'
import { Button } from '@/shared/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'

import { useReaderTrail } from '../hooks/useReaderTrail'
import { readerMessages } from '../reader.constants'
import type { ReaderHref, ReaderView, TrailStep } from '../reader.types'
import { ReaderLink } from './ReaderParts'

/**
 * The bar at the top of the reader: a button that goes up one level, to the step of the path just
 * above the place, and the path itself. The button is there whenever the path has a step above the
 * place, so that it does not depend on what the reader showed before; the path may wrap, and the
 * bar keeps its room above and below it.
 */
export function ReaderBar({ view, hrefOf }: { view: ReaderView; hrefOf: ReaderHref }) {
  const steps = useReaderTrail(view)
  if (steps === null) return null
  const parent = steps.at(-2)?.view ?? null

  return (
    <div className="flex min-h-12 items-start gap-2 px-2 py-3">
      {parent !== null && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button asChild variant="soft" color="neutral" size="icon-sm">
              <ReaderLink href={hrefOf(parent)}>
                <ArrowUpIcon aria-hidden />
                <span className="sr-only">{readerMessages.up}</span>
              </ReaderLink>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">{readerMessages.up}</TooltipContent>
        </Tooltip>
      )}
      <ReaderBreadcrumb steps={steps} hrefOf={hrefOf} />
    </div>
  )
}

/** Where the reader is: the documents, the document, the folders above, and the place itself. */
function ReaderBreadcrumb({ steps, hrefOf }: { steps: TrailStep[]; hrefOf: ReaderHref }) {
  return (
    <Breadcrumb aria-label={readerMessages.location} className="min-w-0 self-center">
      <BreadcrumbList>
        {steps.map((step, index) => (
          <Fragment key={`${String(index)}:${step.title}`}>
            {index > 0 && <BreadcrumbSeparator>{readerMessages.separator}</BreadcrumbSeparator>}
            <BreadcrumbItem className="min-w-0">
              {step.view === null ? (
                <BreadcrumbPage className="truncate">{step.title}</BreadcrumbPage>
              ) : (
                <ReaderLink href={hrefOf(step.view)} className="truncate font-normal">
                  {step.title}
                </ReaderLink>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
