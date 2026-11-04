import type { Tone } from '@/shared/lib/tone'

/**
 * The tone of each value of a badge field, by the path of the field, for a fixed enum of the
 * schema files. A value without a row reads in the neutral tone.
 */
export const valueTonesByField: Readonly<Record<string, Readonly<Record<string, Tone>>>> = {
  'persona.interview_status': {
    not_started: 'muted',
    in_progress: 'primary',
    completed: 'success',
  },
}
