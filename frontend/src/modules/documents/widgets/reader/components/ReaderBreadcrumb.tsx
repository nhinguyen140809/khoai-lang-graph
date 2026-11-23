'use client'

import { Fragment } from 'react'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/shared/components/ui/breadcrumb'

import { useReaderTrail } from '../hooks/useReaderTrail'
import { readerMessages } from '../reader.constants'
import type { ReaderHref, ReaderView } from '../reader.types'
import { ReaderLink } from './ReaderParts'

/** Where the reader is: the documents, the document, the folders above, and the place itself. */
export function ReaderBreadcrumb({ view, hrefOf }: { view: ReaderView; hrefOf: ReaderHref }) {
  const steps = useReaderTrail(view)
  if (steps === null) return null

  return (
    <Breadcrumb aria-label={readerMessages.location} className="min-w-0">
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
