import { apiEndpoints } from '@/shared/api/endpoints'
import { fetchAllPages } from '@/shared/api/request'

import { modelsPageSize } from './models.constants'
import { type ModelCatalogEntry, modelCatalogEntrySchema } from './models.types'

// TODO: switch to the generated client in src/shared/api/generated/ once it is generated.

/** The models that the user may choose, ordered by `model_id`. */
export function listModels(): Promise<ModelCatalogEntry[]> {
  return fetchAllPages(apiEndpoints.models.path(), modelCatalogEntrySchema, {
    limit: modelsPageSize,
    action: 'load the models',
  })
}
