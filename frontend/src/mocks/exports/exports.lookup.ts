import type { Artifact, Export } from '@/modules/artifact/entities'
import { apiEndpoints } from '@/shared/api/endpoints'

import { allArtifacts, allItems } from '../artifacts/artifacts.lookup'
import { msSince } from '../shared/db'
import { workflowDefinitionFixture } from '../workflow/workflow.fixtures'
import { exportReadyAfterMs } from './exports.constants'
import { createdExports } from './exports.store'

/** The export with this id, or undefined when the mock server holds none. */
export function findExport(exportId: string): Export | undefined {
  return createdExports.get().find(({ id }) => id === exportId)
}

/** The export template with this key, or undefined when the workflow offers none. */
export function findExportTemplate(templateKey: string) {
  return workflowDefinitionFixture.export_templates.find(({ key }) => key === templateKey)
}

/** The artifacts of the project that the template of an export holds. */
export function exportedArtifacts(projectId: string, templateKey: string): Artifact[] {
  const kinds = findExportTemplate(templateKey)?.artifact_kinds ?? []
  return allArtifacts().filter(
    (artifact) => artifact.project_id === projectId && kinds.includes(artifact.kind),
  )
}

/** The text of the file of an export. */
export function fileOf(entry: Export): string {
  const artifacts = exportedArtifacts(entry.project_id, entry.template)
  const lines = artifacts.flatMap((artifact) => [
    `# ${artifact.title}`,
    '',
    ...allItems()
      .filter((item) => item.artifact_id === artifact.id)
      .map((item) => `- ${item.key}: ${JSON.stringify(item.content)}`),
    '',
  ])
  return entry.format === 'json'
    ? JSON.stringify(artifacts, null, 2)
    : [`Export: ${entry.template}`, '', ...lines].join('\n')
}

/**
 * The export as its page reads it: `pending` while the file is prepared, `ready` with its size and
 * its address once the file is done.
 */
export function withReadyFile(entry: Export): Export {
  const isDone = msSince(entry.created_at) > exportReadyAfterMs
  if (!isDone) return entry
  return {
    ...entry,
    status: 'ready',
    size_bytes: fileOf(entry).length,
    download_url: apiEndpoints.exportEntryFile.path({ exportId: entry.id }),
  }
}
