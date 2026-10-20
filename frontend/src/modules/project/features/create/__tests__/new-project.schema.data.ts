/** The fields of the form, and the values it sends. */
export const validFormCases = [
  {
    name: 'trims the name and the idea',
    form: { name: ' Mentors ', output_language: 'en', idea: ' Find a mentor. ' },
    values: { name: 'Mentors', output_language: 'en', idea: 'Find a mentor.' },
  },
  {
    name: 'sends a blank name as null, for the agents to name the project',
    form: { name: '  ', output_language: 'vi', idea: 'Find a mentor.\nFor university students.' },
    values: {
      name: null,
      output_language: 'vi',
      idea: 'Find a mentor.\nFor university students.',
    },
  },
]

/** The fields of the form, and the problems it shows, by field. */
export const invalidFormCases = [
  {
    name: 'a blank idea',
    form: { name: 'Mentors', output_language: 'en', idea: ' \n ' },
    issues: [[['idea'], 'Describe the idea.']],
  },
  {
    name: 'a language it does not have',
    form: { name: '', output_language: 'fr', idea: 'Find a mentor.' },
    issues: [[['output_language'], 'Invalid option: expected one of "en"|"vi"']],
  },
]
