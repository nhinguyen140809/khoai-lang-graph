import type { ArtifactItem } from '@/modules/artifact/entities'

import { mockState } from '../shared/db'
import type { ArtifactOverride, ItemOverride } from './artifacts.types'

// What the mock server changes about artifacts while the app runs: the items and the artifacts that
// the user changed, and the items the user made. The fixtures never change.

/** The items that the user made, as they were made. */
export const createdItems = mockState<ArtifactItem[]>('created-items', () => [])
/** The overrides of the items of the fixtures and of the created items, by item id. */
export const itemOverrides = mockState<Record<string, ItemOverride>>('item-overrides', () => ({}))
/** The overrides of the artifacts, by artifact id. */
export const artifactOverrides = mockState<Record<string, ArtifactOverride>>(
  'artifact-overrides',
  () => ({}),
)
