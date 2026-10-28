import type { TraceLink } from '@/modules/trace/entities'

import { itemFixtures } from '../../artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '../../shared/db'
import { mentorPlatformLinkSpecs } from './mentor-platform-trace-links.fixtures'
import { buildTraceLinks } from './trace-link-builder.fixtures'

// The trace links of the mock projects. Only the mentor platform has them: the other projects hold
// a plan, personas and a short specification, with no chain between them.

export const traceLinkFixtures: TraceLink[] = buildTraceLinks(
  mentorPlatformLinkSpecs,
  itemFixtures.filter(({ project_id }) => project_id === projectIds.mentor),
  1,
)
