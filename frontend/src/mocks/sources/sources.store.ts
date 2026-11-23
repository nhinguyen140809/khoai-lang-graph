import type { Source } from '@/modules/source/entities'

import { mockState } from '../shared/db'

/** The sources that uploads created, newest first. */
export const createdSources = mockState<Source[]>('created-sources', () => [])
