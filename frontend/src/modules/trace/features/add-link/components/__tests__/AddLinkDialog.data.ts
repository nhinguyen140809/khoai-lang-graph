import { itemFixtureByKey } from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '@/mocks/shared/db'
import type { FieldValidationSuite } from '@/test/suites'

export const projectId = projectIds.mentor

/** An item of the document under review, which a link may start from. */
export const source = itemFixtureByKey(projectId, 'AR-003')

/** A persona that the search of the other item finds. */
export const persona = itemFixtureByKey(projectId, 'PER-001')

/** An item of a document that is not under review, which no link may start from. */
export const lockedSource = itemFixtureByKey(projectId, 'REQ-001')

/** The fields the form asks for before it sends. */
export const fieldCases: FieldValidationSuite['cases'] = [
  {
    name: 'the other item',
    typed: { Note: 'Check this first.' },
    messages: ['Choose the other item.'],
  },
  {
    name: 'a note that is too long',
    typed: { Note: 'a'.repeat(501) },
    messages: ['Write at most 500 characters.'],
  },
]
