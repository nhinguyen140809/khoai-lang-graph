import type { RunStatus } from '@/modules/run/entities'

/** A delivery, the status of the run, and the note under the message in the user view. */
export const messageDeliveryNoteCases: {
  name: string
  delivery: 'started_run' | 'delivered' | 'pending' | 'undelivered' | null
  runStatus: RunStatus | null
  note: string | null
}[] = [
  {
    name: 'a message that started a run has no note',
    delivery: 'started_run',
    runStatus: 'running',
    note: null,
  },
  {
    name: 'a message the agents read has no note',
    delivery: 'delivered',
    runStatus: 'running',
    note: null,
  },
  {
    name: 'a pending message of a working run is read after the current step',
    delivery: 'pending',
    runStatus: 'running',
    note: 'Will be read after the current step.',
  },
  {
    name: 'a pending message of a run that waits is read after the review',
    delivery: 'pending',
    runStatus: 'interrupted',
    note: 'Will be read after you answer the review.',
  },
  {
    name: 'a pending message of a thread without a run is read after the current step',
    delivery: 'pending',
    runStatus: null,
    note: 'Will be read after the current step.',
  },
  {
    name: 'a pending message of a run that ended is read never',
    delivery: 'pending',
    runStatus: 'succeeded',
    note: 'Not read: the work ended before this message.',
  },
  {
    name: 'a pending message of a run that stopped is read never',
    delivery: 'pending',
    runStatus: 'cancelled',
    note: 'Not read: the work ended before this message.',
  },
  {
    name: 'an undelivered message says the work ended before it',
    delivery: 'undelivered',
    runStatus: 'succeeded',
    note: 'Not read: the work ended before this message.',
  },
  {
    name: 'a message of an agent has no delivery and no note',
    delivery: null,
    runStatus: null,
    note: null,
  },
]
