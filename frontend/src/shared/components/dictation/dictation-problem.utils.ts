import type { SpeechProblem } from '@/shared/lib/speech'

import { dictationMessages } from './dictation.constants'

const problemMessages: Record<SpeechProblem, string> = {
  'not-allowed': dictationMessages.microphoneRefused,
  'no-microphone': dictationMessages.noMicrophone,
  other: dictationMessages.notHeard,
}

/** What to tell the user of a failure to listen, in words. */
export function dictationProblemMessage(problem: SpeechProblem): string {
  return problemMessages[problem]
}
