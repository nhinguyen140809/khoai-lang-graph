import type { ReviewableCheckpoint } from '@/modules/workflow/entities/@x/run'

import { parameterFields } from '../../config/__tests__/run-defaults.utils.data'

/** The reviews that the tests of the fields offer. */
export const checkpoints: ReviewableCheckpoint[] = [
  {
    id: 'checkpoint_personas',
    title: 'Finalize the interviewees',
    description: 'Check the interviewees before the interviews.',
  },
  {
    id: 'checkpoint_analysis',
    title: 'Review the analysis',
    description: 'Check the requirements found in the interviews.',
  },
]

/** What the run settings offer in the tests of the fields. */
export const runSettingsOptions = { checkpoints, parameterFields }
