import type { RunEvent } from './run-events.types'

const noArtifacts: ReadonlySet<string> = new Set()

/**
 * The artifacts written since the last `node_start`: an artifact that the node creates or changes
 * joins them, and a node that starts or ends, an interrupt, an error or the end of the run empties
 * them. Any other event leaves them as they are.
 */
export function artifactsInProgress(
  ids: ReadonlySet<string>,
  event: RunEvent,
): ReadonlySet<string> {
  switch (event.type) {
    case 'node_start':
    case 'node_end':
    case 'interrupt':
    case 'error':
    case 'done':
      return ids.size === 0 ? ids : noArtifacts
    case 'artifact_created':
    case 'artifact_delta': {
      if (ids.has(event.data.artifact_id)) return ids
      return new Set([...ids, event.data.artifact_id])
    }
    default:
      return ids
  }
}
