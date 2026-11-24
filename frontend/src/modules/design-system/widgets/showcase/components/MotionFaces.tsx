import { AgentFace, type MoodOverride } from '@/shared/components/face'

import { SampleLabel } from './Sample'

/** The faces of one kind of motion, each with its name: the same agent in the same mood, with one part of what the mood does said otherwise. */
export function MotionFaces<Name extends string>({
  names,
  overrideOf,
  uses,
}: {
  names: readonly Name[]
  overrideOf: (name: Name) => MoodOverride
  uses?: Partial<Record<Name, string>>
}) {
  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-10 @xl:grid-cols-3 @3xl:grid-cols-4 @5xl:grid-cols-6">
      {names.map((name) => (
        <div key={name} className="flex flex-col items-start gap-2">
          <AgentFace seed="analyst" size="lg" override={overrideOf(name)} />
          <SampleLabel>{name}</SampleLabel>
          {uses?.[name] !== undefined && (
            <SampleLabel className="opacity-70">{uses[name]}</SampleLabel>
          )}
        </div>
      ))}
    </div>
  )
}
