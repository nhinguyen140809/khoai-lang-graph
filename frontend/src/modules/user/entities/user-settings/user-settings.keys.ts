/** The query keys of the settings of the user, from the widest to the narrowest. */
export const userSettingsKeys = {
  all: () => ['user-settings'] as const,
  /** The settings of the signed-in user. */
  detail: () => [...userSettingsKeys.all(), 'detail'] as const,
}
