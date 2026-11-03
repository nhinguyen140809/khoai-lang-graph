import { isProduction } from '@/shared/config/env'
import { minuteMs } from '@/shared/lib/timing'

// What the workflow definition decides, such as the content schemas of the kinds, changes only with
// a deploy. A production build reads it again after an hour; any other build after ten minutes, so
// that a changed definition shows without a reload.
export const workflowDefinitionStaleTime = isProduction ? 60 * minuteMs : 10 * minuteMs
