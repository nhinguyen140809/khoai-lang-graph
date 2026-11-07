'use client'

import { useView } from '@/shared/lib/view'

import { messageDeliveryLooks } from '../message-look.constants'
import { messageDeliveryLabels } from '../messages.constants'
import type { MessageDelivery } from '../messages.types'

/** How the delivery of a message of the user shows, with its label in the view of the app. */
export function useMessageDeliveryLook(delivery: MessageDelivery | null) {
  const view = useView()
  // A message that is not of the user has no delivery: the primary look without a label.
  return {
    tone: delivery === null ? 'primary' : messageDeliveryLooks[delivery],
    label: delivery === null ? null : messageDeliveryLabels[delivery][view],
  }
}
