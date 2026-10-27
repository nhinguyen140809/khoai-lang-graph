import type { Export } from '@/modules/artifact/entities'

import { mockState } from '../shared/db'

export const createdExports = mockState<Export[]>('created-exports', () => [])
