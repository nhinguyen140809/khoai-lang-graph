'use client'

import {
  AgentFace,
  defaultFaceRules,
  FaceRulesProvider,
  faceShapes,
} from '@/shared/components/face'

import type { CardEntry } from '../../../design-system.types'
import { SampleCard, SampleGroup, SampleLabel } from '../../Sample'

// The agents of the workflow of the fixtures, and keys that no one drew a face for: both get one.
const workflowAgents = [
  'planner',
  'persona_generator',
  'interviewer',
  'persona_agent',
  'analyst',
  'requirement_engineer',
  'backlog_manager',
  'validator',
  'intent_router',
] as const
const otherAgents = [
  'reviewer',
  'translator',
  'summarizer',
  'router',
  'critic',
  'writer',
  'tester',
  'scout',
] as const

export function FaceCard() {
  return (
    <SampleCard
      title="Faces"
      description="A shape of soft color, a pale base with two blurred blobs on it, with two long eyes, worked out from a seed such as the key of an agent: the same key is the same face everywhere, and a key that no one has seen gets one too."
      className="flex flex-col gap-10"
    >
      <SampleGroup label="The agents of the workflow, idle">
        <div className="grid grid-cols-2 gap-x-8 gap-y-6 @xl:grid-cols-3 @3xl:grid-cols-4 @5xl:grid-cols-6">
          {workflowAgents.map((agent) => (
            <div key={agent} className="flex items-center gap-2">
              <AgentFace seed={agent} />
              <SampleLabel>{agent}</SampleLabel>
            </div>
          ))}
        </div>
      </SampleGroup>
      <SampleGroup label="The outlines that the rules allow; a face takes one of them from its seed">
        <div className="flex flex-wrap gap-x-10 gap-y-6">
          {faceShapes.map((shape) => (
            <div key={shape} className="flex items-center gap-2">
              <FaceRulesProvider rules={{ ...defaultFaceRules, shapes: [shape] }}>
                <AgentFace seed="interviewer" size="lg" />
              </FaceRulesProvider>
              <SampleLabel>{shape}</SampleLabel>
            </div>
          ))}
        </div>
      </SampleGroup>
      <SampleGroup label="Any other key, and the sizes: sm, default, lg">
        <div className="flex flex-wrap items-end gap-x-10 gap-y-6">
          {otherAgents.map((agent) => (
            <div key={agent} className="flex items-center gap-2">
              <AgentFace seed={agent} />
              <SampleLabel>{agent}</SampleLabel>
            </div>
          ))}
          <AgentFace seed="validator" size="sm" />
          <AgentFace seed="validator" />
          <AgentFace seed="validator" size="lg" />
        </div>
      </SampleGroup>
    </SampleCard>
  )
}

export const faceCardEntry = {
  id: 'faces',
  label: 'Faces',
  section: 'agents',
  span: 12,
  keywords: 'face avatar agent expression AgentFace FaceRulesProvider',
  View: FaceCard,
} satisfies CardEntry
