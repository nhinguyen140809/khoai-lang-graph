import { runParameterFields } from '@/modules/workflow/entities/@x/run'

const [integer, flag, note, choice, withDefault, flagWithDefault] = runParameterFields({
  type: 'object',
  properties: {
    max_turns: { type: 'integer', title: 'Turns', minimum: 1, maximum: 5 },
    strict: { type: 'boolean', title: 'Strict' },
    note: { type: 'string', title: 'Note' },
    mode: { type: 'string', title: 'Mode', enum: ['fast', 'deep'] },
    roles: { type: 'array', title: 'Roles', items: { type: 'string' } },
    turns: { type: 'integer', title: 'Turns left', default: 6 },
    loud: { type: 'boolean', title: 'Loud', default: false },
  },
})

/** A run parameter, and the control that its widget gets. */
export const controlCases = [
  { name: 'an integer', field: integer, role: 'spinbutton', label: 'Turns' },
  { name: 'a flag', field: flag, role: 'radiogroup', label: 'Strict' },
  { name: 'a text', field: note, role: 'textbox', label: 'Note' },
  { name: 'a choice', field: choice, role: 'combobox', label: 'Mode' },
] as const

/** A run parameter that is a flag, which has three states. */
export const flagField = flag

/** A run parameter that is a number, and one that is a flag, each with a default. */
export const numberWithDefault = withDefault

export const flagWithDefaultField = flagWithDefault

/** A run parameter that is a choice among values. */
export const choiceField = choice
