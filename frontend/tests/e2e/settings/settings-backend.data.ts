/** A change of the settings of the user, put and read back. */
export const changedSettings = {
  theme: 'dark',
  ui_language: 'vi',
  default_output_language: 'vi',
  default_run_config: {
    review_checkpoints: ['checkpoint_spec'],
    max_steps: 120,
    max_cost_usd: 2.5,
    parameters: null,
  },
  notify_on_interrupt: false,
  notify_on_run_finished: true,
} as const

/** A value of the settings that the API refuses, and the field it names. */
export const refusedSettings: { name: string; change: Record<string, unknown>; field: string }[] = [
  { name: 'a theme that does not exist', change: { theme: 'neon' }, field: 'theme' },
  { name: 'a language that is not offered', change: { ui_language: 'fr' }, field: 'ui_language' },
]
