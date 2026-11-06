'use client'

import { ChevronRightIcon, CircleAlertIcon, CircleCheckIcon, DotIcon } from 'lucide-react'

import { FeedEntry } from '@/shared/components/feed'
import { CopyButton } from '@/shared/components/ui/copy-button'

import { SampleCard } from '../Sample'

export function FeedEntryCard() {
  return (
    <SampleCard
      title="Entries of a feed"
      description="Full width, a small mark, a fill for the user, actions below."
      className="flex flex-col gap-3"
    >
      <FeedEntry
        anchorId="feed-user"
        mark={<ChevronRightIcon />}
        markColor="primary"
        label="You"
        isFilled
        actions={
          <CopyButton
            value="Try a design that suits both the student and the admin."
            display="text"
          />
        }
      >
        Try a design that suits both the student and the admin.
      </FeedEntry>
      <FeedEntry anchorId="feed-agent" mark={<DotIcon />} markColor="chart" label="Agents">
        The student and the admin disagree on who approves a booking, see CONF-001.
      </FeedEntry>
      <FeedEntry
        anchorId="feed-work"
        mark={<CircleCheckIcon />}
        markColor="success"
        label="Work done"
      >
        Analysing the interviews, 24 written
      </FeedEntry>
      <FeedEntry
        anchorId="feed-review"
        mark={<CircleAlertIcon />}
        markColor="warning"
        label="Waiting for you"
      >
        Reviewing the analysis
      </FeedEntry>
    </SampleCard>
  )
}
