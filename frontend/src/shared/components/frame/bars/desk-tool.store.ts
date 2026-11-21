import { createRegistryStore } from '@/shared/lib/registry'

import type { DeskTool } from './desk-tool.types'

/** The tools of the open project. Their pages register them with `useDeskTool`. */
export const useDeskToolStore = createRegistryStore<DeskTool>()
