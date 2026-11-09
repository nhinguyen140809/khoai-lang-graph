import ambiguityIssue from './ambiguity_issue.v1.json' with { type: 'json' }
import analyzedRequirement from './analyzed_requirement.v1.json' with { type: 'json' }
import assumption from './assumption.v1.json' with { type: 'json' }
import backlogItem from './backlog_item.v1.json' with { type: 'json' }
import conflict from './conflict.v1.json' with { type: 'json' }
import elicitationPlan from './elicitation_plan.v1.json' with { type: 'json' }
import interviewMessage from './interview_message.v1.json' with { type: 'json' }
import interviewTranscript from './interview_transcript.v1.json' with { type: 'json' }
import latentNeed from './latent_need.v1.json' with { type: 'json' }
import persona from './persona.v1.json' with { type: 'json' }
import personaCatalog from './persona_catalog.v1.json' with { type: 'json' }
import productBacklog from './product_backlog.v1.json' with { type: 'json' }
import rawRequirement from './raw_requirement.v1.json' with { type: 'json' }
import requirementSpecification from './requirement_specification.v1.json' with { type: 'json' }
import requirementsAnalysis from './requirements_analysis.v1.json' with { type: 'json' }
import section from './section.v1.json' with { type: 'json' }
import specRequirement from './spec_requirement.v1.json' with { type: 'json' }
import validationIssue from './validation_issue.v1.json' with { type: 'json' }
import validationReport from './validation_report.v1.json' with { type: 'json' }

/** The content schemas at version 1, by kind, as the files hold them. */
export const contentSchemaFiles: Record<string, unknown> = {
  ambiguity_issue: ambiguityIssue,
  analyzed_requirement: analyzedRequirement,
  assumption,
  backlog_item: backlogItem,
  conflict,
  elicitation_plan: elicitationPlan,
  interview_message: interviewMessage,
  interview_transcript: interviewTranscript,
  latent_need: latentNeed,
  persona,
  persona_catalog: personaCatalog,
  product_backlog: productBacklog,
  raw_requirement: rawRequirement,
  requirement_specification: requirementSpecification,
  requirements_analysis: requirementsAnalysis,
  section,
  spec_requirement: specRequirement,
  validation_issue: validationIssue,
  validation_report: validationReport,
}
