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
  'assumption.validation_status': {
    unverified: 'warning',
    confirmed: 'success',
    invalidated: 'neutral',
  },
  'ambiguity_issue.status': {
    open: 'warning',
    resolved: 'success',
    dismissed: 'neutral',
  },
  'conflict.status': {
    open: 'warning',
    resolved: 'success',
    dismissed: 'neutral',
  },
  'conflict.severity': {
    low: 'muted',
    medium: 'neutral',
    high: 'warning',
  },
  'validation_issue.status': {
    open: 'warning',
    fixed: 'success',
    dismissed: 'neutral',
  },
  'validation_issue.severity': {
    low: 'muted',
    medium: 'neutral',
    high: 'warning',
  },
  'validation_report.status': { fail: 'destructive', pass: 'success' },
}
