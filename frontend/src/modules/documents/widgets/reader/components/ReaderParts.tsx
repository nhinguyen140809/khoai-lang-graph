import Link from 'next/link'
import type { ComponentProps, ReactNode } from 'react'

import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { cn } from '@/shared/lib/cn'

import type { RenderReaderTitle } from '../reader.types'

/** The content under its title, in an area that scrolls. */
export function ContentBody({
  title,
  renderTitle,
  children,
}: {
  title: string
  renderTitle: RenderReaderTitle
  children: ReactNode
}) {
  return (
    <>
      {renderTitle(title)}
      <ScrollArea className="min-h-0 flex-1">{children}</ScrollArea>
    </>
  )
}

/** A link inside the reader, which opens another view in it. */
export function ReaderLink({ className, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      scroll={false}
      className={cn('font-medium underline-offset-4 hover:underline', className)}
      {...props}
    />
  )
}
