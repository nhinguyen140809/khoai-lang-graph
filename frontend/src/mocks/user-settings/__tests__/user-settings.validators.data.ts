/** A body of PUT /me/settings that the mock accepts. */
export const acceptedSettingsBodies = [
  { name: 'an empty body', body: {} },
  {
    name: 'every setting',
    body: {
      theme: 'light',
      ui_language: 'vi',
      default_output_language: 'vi',
      default_run_config: {
        review_checkpoints: ['analysis'],
        max_steps: 40,
        max_cost_usd: 2.5,
        parameters: { max_turns: 3 },
      },
      notify_on_interrupt: false,
      notify_on_run_finished: true,
    },
  },
]

/** A body of PUT /me/settings that the mock refuses, and the problems of its fields. */
export const refusedSettingsBodies = [
  {
    name: 'a theme out of the list',
    body: { theme: 'neon' },
    problems: [{ field: 'theme', message: 'Choose one of the values.' }],
  },
  {
    name: 'a language of the screens out of the list',
    body: { ui_language: 'fr' },
    problems: [{ field: 'ui_language', message: 'Choose one of the values.' }],
  },
  {
    name: 'a language of the documents out of the list',
    body: { default_output_language: 'fr' },
    problems: [{ field: 'default_output_language', message: 'Choose one of the values.' }],
  },
  {
    name: 'a notification that is a string',
    body: { notify_on_interrupt: 'yes' },
    problems: [{ field: 'notify_on_interrupt', message: 'Send a value of type boolean.' }],
  },
  {
    name: 'run settings with the wrong type of a field',
    body: { default_run_config: { max_steps: 'many' } },
    problems: [
      {
        field: 'default_run_config.max_steps',
        message: 'Send a value of type integer or null.',
      },
    ],
  },
  {
    name: 'a field that is not allowed',
    body: { user_id: 'someone-else' },
    problems: [{ field: 'user_id', message: 'This field is not allowed.' }],
  },
]
