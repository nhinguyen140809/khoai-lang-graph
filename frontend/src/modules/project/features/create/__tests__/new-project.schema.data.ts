import { noRunDefaultsFieldValues } from '@/modules/run/entities'

/** The fields of the form, and the values it sends. */
export const validFormCases = [
  {
    name: 'trims the name and the idea',
    form: {
      name: ' Mentors ',
      output_language: 'en',
      idea: ' Find a mentor. ',
      run_config: noRunDefaultsFieldValues,
    },
    values: {
      name: 'Mentors',
      output_language: 'en',
      idea: 'Find a mentor.',
      run_config: noRunDefaultsFieldValues,
    },
  },
  {
    name: 'sends a blank name as null, for the agents to name the project',
    form: {
      name: '  ',
      output_language: 'vi',
      idea: 'Find a mentor.\nFor university students.',
      run_config: noRunDefaultsFieldValues,
    },
    values: {
      name: null,
      output_language: 'vi',
      idea: 'Find a mentor.\nFor university students.',
      run_config: noRunDefaultsFieldValues,
    },
  },
]

/** The fields of the form, and the problems it shows, by field. */
export const invalidFormCases = [
  {
    name: 'a blank idea',
    form: {
      name: 'Mentors',
      output_language: 'en',
      idea: ' \n ',
      run_config: noRunDefaultsFieldValues,
    },
    issues: [[['idea'], 'Describe the idea.']],
  },
  {
    name: 'a language it does not have',
    form: {
      name: '',
      output_language: 'fr',
      idea: 'Find a mentor.',
      run_config: noRunDefaultsFieldValues,
    },
    issues: [[['output_language'], 'Invalid option: expected one of "en"|"vi"']],
  },
  {
    name: 'a run setting out of its limits',
    form: {
      name: '',
      output_language: 'en',
      idea: 'Find a mentor.',
      run_config: { ...noRunDefaultsFieldValues, max_steps: 0 },
    },
    issues: [[['run_config', 'max_steps'], 'Enter 1 or more.']],
  },
]
