import { WaypointsIcon } from 'lucide-react'

import type { FeatureDestination } from '@/shared/components/frame'
import { encodeId } from '@/shared/lib/url'
import { routes } from '@/shared/routes'

import { TracePanel } from './components/TracePanel'

/** Trace on the activity bar: the chain of an item, the gaps and the open issues of a project. */
export function traceDestination(projectId: string): FeatureDestination {
  return {
    id: 'trace',
    label: 'Trace',
    icon: <WaypointsIcon />,
    href: routes.project(projectId).trace(),
    paths: [`/projects/${encodeId(projectId)}/trace`],
    panel: <TracePanel projectId={projectId} />,
  }
}
