import type { ModelCatalogEntry } from '@/modules/llm-model/entities'

import { modelFixtures } from './models.fixtures'

// The model catalog as the mock server holds it: server configuration, so it does not change.

/** Every model of the catalog, ordered by `model_id`. */
export function allModels(): ModelCatalogEntry[] {
  return modelFixtures.toSorted((a, b) => a.model_id.localeCompare(b.model_id))
}

/** The ids of the models that may serve an agent role; none for a role that is not known. */
export function modelIdsForRole(role: string): string[] {
  return allModels()
    .filter(({ allowed_roles: allowedRoles }) => allowedRoles.includes(role))
    .map(({ model_id: modelId }) => modelId)
}
