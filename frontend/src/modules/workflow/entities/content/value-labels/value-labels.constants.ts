import type { Wording } from '@/shared/lib/view'

import {
  messageRoleLabels,
  personaInterviewStatusLabels,
  stopReasonLabels,
  transcriptStatusLabels,
} from './interview-value-labels.constants'
import {
  ambiguityStatusLabels,
  conflictStatusLabels,
  severityLabels,
  validationIssueStatusLabels,
  validationResultLabels,
} from './issue-value-labels.constants'
import {
  assumptionStatusLabels,
  confidenceLabels,
  dispositionLabels,
} from './need-value-labels.constants'
import {
  backlogItemTypeLabels,
  deliveryStatusLabels,
  requirementTypeLabels,
  verificationMethodLabels,
} from './requirement-value-labels.constants'

/**
 * The labels of the values of each select field that has some, by the path of the field, which is
 * its kind and its name. A field that is not here shows its values in sentence case.
 */
export const valueLabelsByField: Readonly<Record<string, Readonly<Record<string, Wording>>>> = {
  'persona.interview_status': personaInterviewStatusLabels,
  'interview_transcript.status': transcriptStatusLabels,
  'interview_transcript.stop_reason': stopReasonLabels,
  'interview_message.role': messageRoleLabels,
  'ambiguity_issue.status': ambiguityStatusLabels,
  'conflict.status': conflictStatusLabels,
  'conflict.severity': severityLabels,
  'validation_issue.status': validationIssueStatusLabels,
  'validation_issue.severity': severityLabels,
  'validation_report.status': validationResultLabels,
  'latent_need.confidence': confidenceLabels,
  'latent_need.disposition': dispositionLabels,
  'assumption.validation_status': assumptionStatusLabels,
  'analyzed_requirement.type': requirementTypeLabels,
  'spec_requirement.type': requirementTypeLabels,
  'spec_requirement.verification_method': verificationMethodLabels,
  'backlog_item.item_type': backlogItemTypeLabels,
  'backlog_item.delivery_status': deliveryStatusLabels,
}
