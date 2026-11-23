'use client'

import type { ComponentProps } from 'react'
import { toast } from 'sonner'

import {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoiceDescription,
  QuestionnaireChoices,
  QuestionnaireDescription,
  QuestionnaireError,
  QuestionnaireInput,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireProgress,
  QuestionnaireSkip,
  QuestionnaireSubmit,
  QuestionnaireTitle,
} from '@/shared/components/ui/questionnaire'
import { isString } from '@/shared/lib/guards'

import { personas } from '../../design-system.fixtures'
import { SampleCard } from '../Sample'

const items = [
  {
    name: 'decision',
    required: true,
    choices: [{ value: 'accept' }, { value: 'reject_reanalyse' }, { value: 'reject_reinterview' }],
  },
  {
    name: 'personas',
    choices: [{ value: 'PER-001' }, { value: 'PER-002' }, { value: 'PER-003' }],
  },
] as const

const sendAnswer: NonNullable<ComponentProps<typeof Questionnaire>['onSubmit']> = (event) => {
  event.preventDefault()
  const decision = new FormData(event.currentTarget).get('decision')
  toast('Answer sent', {
    description: `Decision: ${isString(decision) ? decision : 'none'}`,
  })
}

export function ReviewCard() {
  return (
    <SampleCard
      title="Review: requirements analysis v4"
      description="The run paused at checkpoint_analysis. Keys 1 to 3 choose."
    >
      <Questionnaire defaultItem="decision" items={items} shortcuts="numbers" onSubmit={sendAnswer}>
        <QuestionnaireProgress />
        <QuestionnaireItem name="decision" required>
          <QuestionnaireTitle>Accept the analysis, or reject it?</QuestionnaireTitle>
          <QuestionnaireDescription>You edited AR-007 before answering.</QuestionnaireDescription>
          <QuestionnaireChoices>
            <QuestionnaireChoice value="accept">Accept</QuestionnaireChoice>
            <QuestionnaireChoice value="reject_reanalyse">
              Reject and re-analyse
              <QuestionnaireChoiceDescription>
                The analyst works again from the same interviews.
              </QuestionnaireChoiceDescription>
            </QuestionnaireChoice>
            <QuestionnaireChoice value="reject_reinterview">
              Reject and re-interview
              <QuestionnaireChoiceDescription>
                The interviewer asks the personas again first.
              </QuestionnaireChoiceDescription>
            </QuestionnaireChoice>
            <QuestionnaireInput aria-label="Feedback" placeholder="Feedback for the agents" />
          </QuestionnaireChoices>
          <QuestionnaireError />
        </QuestionnaireItem>
        <QuestionnaireItem name="personas" multiple>
          <QuestionnaireTitle>Which personas should be interviewed again?</QuestionnaireTitle>
          <QuestionnaireDescription>Select all that apply, or skip.</QuestionnaireDescription>
          <QuestionnaireChoices>
            {personas.map((persona) => (
              <QuestionnaireChoice key={persona.key} value={persona.key}>
                {persona.key} {persona.name}
              </QuestionnaireChoice>
            ))}
          </QuestionnaireChoices>
          <QuestionnaireError />
        </QuestionnaireItem>
        <QuestionnaireActions>
          <QuestionnairePrevious />
          <QuestionnaireSkip />
          <QuestionnaireNext>Next</QuestionnaireNext>
          <QuestionnaireSubmit>Send answer</QuestionnaireSubmit>
        </QuestionnaireActions>
      </Questionnaire>
    </SampleCard>
  )
}
