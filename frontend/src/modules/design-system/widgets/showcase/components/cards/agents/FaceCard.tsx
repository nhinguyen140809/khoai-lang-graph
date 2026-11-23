'use client'

import { useState } from 'react'

import {
  defaultFaceRules,
  Face,
  faceMotions,
  FaceRulesProvider,
  faceShapes,
  type Mood,
  type MoodOverride,
  moods,
} from '@/shared/components/face'
import { ToggleGroup, ToggleGroupItem } from '@/shared/components/ui/toggle-group'

import { SampleCard, SampleGroup, SampleLabel } from '../Sample'

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

// What each mood is for, in the words of the run.
const moodUses: Record<Mood, string> = {
  idle: 'nothing to do',
  thinking: 'making up its mind',
  working: 'writing',
  waiting: 'waits for you',
  happy: 'done well',
  worried: 'failed',
  surprised: 'a new message',
  sleeping: 'stopped',
}

/** What a motion of a face is for, in the words of the run. */
const motionUses = {
  sway: 'a small sway to each side',
  tilt: 'a tilt to one side, then the other',
  rest: 'a slow breath in the plane of the page',
  pulse: 'zooms in slowly, then fast',
  breathe: 'a slow breath of the whole face',
  bounce: 'jumps straight up and down',
  turnaround: 'turns right around now and then',
} as const

/** The faces of one kind of motion, each with its name: the same agent in the same mood, with one part of what the mood does said otherwise. */
function MotionFaces<Name extends string>({
  names,
  overrideOf,
  uses,
}: {
  names: readonly Name[]
  overrideOf: (name: Name) => MoodOverride
  uses?: Partial<Record<Name, string>>
}) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
      {names.map((name) => (
        <div key={name} className="flex flex-col items-start gap-1">
          <Face seed="analyst" size="lg" override={overrideOf(name)} />
          <SampleLabel>{name}</SampleLabel>
          {uses?.[name] !== undefined && (
            <SampleLabel className="opacity-70">{uses[name]}</SampleLabel>
          )}
        </div>
      ))}
    </div>
  )
}

export function FaceCard() {
  const [mood, setMood] = useState<Mood>('idle')

  return (
    <SampleCard
      title="Faces"
      description="A shape of soft color, a pale base with two blurred blobs on it, with two long eyes, worked out from a seed such as the key of an agent: the same key is the same face everywhere, and a key that no one has seen gets one too. The mood gives the eyes their size, their lean and a way of looking."
      className="flex flex-col gap-5"
    >
      <SampleGroup label="A change of mood goes gently: the eyes close for an instant">
        <div className="flex flex-wrap items-center gap-4">
          <Face seed="requirement_engineer" size="lg" mood={mood} />
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={mood}
            onValueChange={(next) => {
              const chosen = moods.find((candidate) => candidate === next)
              if (chosen !== undefined) setMood(chosen)
            }}
            aria-label="Mood"
            className="flex-wrap"
          >
            {moods.map((candidate) => (
              <ToggleGroupItem key={candidate} value={candidate}>
                {candidate}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </SampleGroup>
      <SampleGroup label="The agents of the workflow, idle">
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
          {workflowAgents.map((agent) => (
            <div key={agent} className="flex items-center gap-2">
              <Face seed={agent} />
              <SampleLabel>{agent}</SampleLabel>
            </div>
          ))}
        </div>
      </SampleGroup>
      <SampleGroup label="One agent in each mood">
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
          {moods.map((mood) => (
            <div key={mood} className="flex flex-col items-start gap-1">
              <Face seed="analyst" size="lg" mood={mood} />
              <SampleLabel>{mood}</SampleLabel>
              <SampleLabel className="opacity-70">{moodUses[mood]}</SampleLabel>
            </div>
          ))}
        </div>
      </SampleGroup>
      <SampleGroup label="Pose: how the whole face moves in the plane of the page, pivoting on its bottom">
        <MotionFaces
          names={faceMotions.poses}
          overrideOf={(pose) => ({ pose })}
          uses={motionUses}
        />
      </SampleGroup>
      <SampleGroup label="Body: what the face does as a whole, about the middle of its depth (the live face turns by a squeeze, as a flat file has no depth)">
        <MotionFaces
          names={faceMotions.bodies}
          overrideOf={(body) => ({ body })}
          uses={motionUses}
        />
      </SampleGroup>
      <SampleGroup label="Eyes: the kinds of eye; a kind that is open blinks, the shut, the smiling, the cross and the spiral ones do not">
        <MotionFaces names={faceMotions.eyes} overrideOf={(kind) => ({ eyes: [kind, kind] })} />
      </SampleGroup>
      <SampleGroup label="What an eye does by itself, besides the way it looks: still, swelling and shrinking, squinting now and then, or winking (one eye)">
        <MotionFaces
          names={faceMotions.eyeLives}
          overrideOf={(life) => ({
            eyeLives: life === 'wink' ? ['steady', 'wink'] : [life, life],
          })}
        />
      </SampleGroup>
      <SampleGroup label="Where the eyes look: each way of looking is a path over time, and the face turns a little with the eyes">
        <MotionFaces names={faceMotions.gazes} overrideOf={(gaze) => ({ gaze })} />
      </SampleGroup>
      <SampleGroup label="The outlines that the rules allow; a face takes one of them from its seed">
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {faceShapes.map((shape) => (
            <div key={shape} className="flex items-center gap-2">
              <FaceRulesProvider rules={{ ...defaultFaceRules, shapes: [shape] }}>
                <Face seed="interviewer" size="lg" />
              </FaceRulesProvider>
              <SampleLabel>{shape}</SampleLabel>
            </div>
          ))}
        </div>
      </SampleGroup>
      <SampleGroup label="Any other key, and the sizes: sm, default, lg">
        <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
          {otherAgents.map((agent) => (
            <div key={agent} className="flex items-center gap-2">
              <Face seed={agent} />
              <SampleLabel>{agent}</SampleLabel>
            </div>
          ))}
          <Face seed="validator" size="sm" />
          <Face seed="validator" />
          <Face seed="validator" size="lg" />
        </div>
      </SampleGroup>
    </SampleCard>
  )
}
