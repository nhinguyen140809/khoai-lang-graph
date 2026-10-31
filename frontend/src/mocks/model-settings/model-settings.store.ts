import type { ModelSetting } from '@/modules/llm-model/entities'

import { mockState } from '../shared/db'

// The model settings that PUT /me/model-settings replaced; null until the first one.
export const replacedModelSettings = mockState<ModelSetting[] | null>('model-settings', () => null)
