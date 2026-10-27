'use client'

import { useState } from 'react'

import { Calendar } from '@/shared/components/ui/calendar'

import { SampleCard } from '../Sample'

// A fixed date, so the server-rendered HTML and the first client render agree.
const reviewDate = new Date(2026, 9, 9)

export function CalendarCard() {
  const [date, setDate] = useState<Date | undefined>(reviewDate)

  return (
    <SampleCard
      title="Review date"
      description="Calendar, single date."
      className="flex justify-center"
    >
      <Calendar
        mode="single"
        defaultMonth={reviewDate}
        selected={date}
        onSelect={setDate}
        className="rounded-md border"
      />
    </SampleCard>
  )
}
