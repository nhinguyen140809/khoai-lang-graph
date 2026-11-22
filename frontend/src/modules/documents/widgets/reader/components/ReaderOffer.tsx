'use client'

import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { Button } from '@/shared/components/ui/button'

import { readerMessages } from '../reader.constants'

interface ReaderOfferProps {
  /** What is offered and why, in a few words. */
  label: string
  onOpen: () => void
  onDismiss: () => void
}

/**
 * A note at the top of the reader that offers another view while the user is reading one. It is
 * announced politely, holds nothing else back, and changes nothing until the user opens it or sets
 * it aside.
 */
export function ReaderOffer({ label, onOpen, onDismiss }: ReaderOfferProps) {
  return (
    <Alert role="status" className="flex items-center gap-2 rounded-none border-x-0 border-t-0">
      <AlertDescription className="min-w-0 flex-1 text-foreground">{label}</AlertDescription>
      <Button size="xs" onClick={onOpen}>
        {readerMessages.offer.open}
      </Button>
      <Button size="xs" variant="ghost" onClick={onDismiss}>
        {readerMessages.offer.dismiss}
      </Button>
    </Alert>
  )
}
