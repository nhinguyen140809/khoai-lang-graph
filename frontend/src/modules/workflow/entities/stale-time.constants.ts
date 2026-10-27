import { isProduction } from '@/shared/config/env'

const MINUTE = 60_000

// What the workflow definition decides, such as the content schemas of the kinds, changes only with
// a deploy. A production build reads it again after an hour; any other build after ten minutes, so
// that a changed definition shows without a reload.
export const workflowDefinitionStaleTime = isProduction ? 60 * MINUTE : 10 * MINUTE
