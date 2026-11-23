import Link from 'next/link'
import type { ComponentProps, ReactNode } from 'react'

import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { cn } from '@/shared/lib/cn'

import type { RenderReaderTitle } from '../reader.types'

/** The content under its title, in an area that scrolls; a state that fills its height, such as an error, is centered in what is left under the title. */
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
      <ScrollArea fillContent className="min-h-0 flex-1">
        {children}
      </ScrollArea>
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
