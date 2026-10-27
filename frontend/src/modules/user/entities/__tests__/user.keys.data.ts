import { userKeys } from '../user.keys'

/** A key, and the wider key it starts with. */
export const keyCases = [{ name: 'the profile', key: userKeys.me(), wider: userKeys.all() }]
