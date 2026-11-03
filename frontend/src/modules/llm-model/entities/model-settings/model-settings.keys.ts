/** The query keys of the model settings of the user, from the widest to the narrowest. */
export const modelSettingKeys = {
  all: () => ['model-settings'] as const,
  /** Every model setting of the user. */
  list: () => [...modelSettingKeys.all(), 'list'] as const,
}
