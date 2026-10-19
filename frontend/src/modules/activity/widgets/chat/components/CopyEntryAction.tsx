'use client'

import { CopyIcon } from 'lucide-react'
import { toast } from 'sonner'

import { activityMessages } from '../activity.constants'
import { EntryAction } from './EntryAction'

/** Copies the text of an entry of the activity. */
export function CopyEntryAction({ text }: { text: string }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(activityMessages.copied)
    } catch {
      toast.error(activityMessages.copyFailed)
    }
  }

  return (
    <EntryAction label={activityMessages.copy} onClick={() => void copy()}>
      <CopyIcon aria-hidden />
    </EntryAction>
  )
}
