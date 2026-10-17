import { type Shot, visit } from '../screenshot.utils'

/** The states of the settings of the user, and the steps to each. */
export const settingsShots: Shot[] = [{ name: 'Settings', steps: visit('/settings') }]
