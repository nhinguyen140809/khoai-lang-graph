import { mockState } from '../shared/db'
import { meFixture } from './me.fixtures'

/** The signed-in user; registering an account replaces it. */
export const currentUser = mockState('me', () => meFixture)

/** The session of the mock server: logged in until the user logs out. */
export const sessionState = mockState('session', () => ({ loggedIn: true }))
