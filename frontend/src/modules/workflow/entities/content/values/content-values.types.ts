import { z } from 'zod'

import type { WorkflowDefinition } from '../../definition/workflow-definition.types'

/** The values of the fields of the content of an artifact or an item, by the name of the field. */
export const contentValuesSchema = z.record(z.string(), z.unknown())

export type ContentValues = z.infer<typeof contentValuesSchema>

/** What titles the values of a field that names a value list; undefined until the definition loads. */
export type ValueDefinition = Pick<WorkflowDefinition, 'value_lists'> | undefined
