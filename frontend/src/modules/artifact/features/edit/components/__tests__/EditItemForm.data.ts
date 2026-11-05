import { itemFixtureByKey } from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '@/mocks/shared/db'
import { contentSchemaFixtureByKind } from '@/mocks/workflow/artifact-kinds.fixtures'

/** An analyzed requirement of the analysis, which its review lets the user change by default. */
export const editableItem = itemFixtureByKey(projectIds.mentor, 'AR-001')
export const editableSchema = contentSchemaFixtureByKind('analyzed_requirement')
