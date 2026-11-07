import type { StageStatus } from '@/modules/run/entities'
import type { Tone } from '@/shared/lib/tone'

/** The fill of the number of a step: plain, soft or solid, from the least to the most important. */
type StepMarkerVariant = 'ghost' | 'soft' | 'solid'

/** How the number of a step shows, by its status: the only mark of the step. */
export const stepMarkerLooks = {
  not_started: { variant: 'ghost', color: 'neutral' },
  running: { variant: 'soft', color: 'primary' },
  waiting: { variant: 'solid', color: 'warning' },
  done: { variant: 'ghost', color: 'success' },
  failed: { variant: 'solid', color: 'destructive' },
  stopped: { variant: 'ghost', color: 'neutral' },
} as const satisfies Record<StageStatus, { variant: StepMarkerVariant; color: Tone }>

/** The words of the panel of the activity of a project. */
export const activityPanelMessages = {
  title: 'Activity',
  progress: 'Progress',
  outline: 'Outline',
  loading: 'Loading the activity',
  loadError: 'The activity could not be loaded.',
  progressLoading: 'Loading the progress',
  progressError: 'The progress could not be loaded.',
  notStarted: 'The work has not started.',
  openReview: 'Open review',
  outlineLoading: 'Loading the messages',
  outlineError: 'The messages could not be loaded.',
  noMessages: 'No messages yet.',
} as const
