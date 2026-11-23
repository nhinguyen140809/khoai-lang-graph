import { MotionDemo, type MotionDemoMotion } from '@/shared/components/act'

import { SampleLabel } from './Sample'

/** A row of demonstrations of motions, each with its name. */
export function MotionRow({ looks }: { looks: Record<string, MotionDemoMotion> }) {
  return (
    <div className="grid grid-cols-2 gap-x-10 gap-y-12 px-10 py-8 @xl:grid-cols-3 @3xl:grid-cols-4">
      {Object.entries(looks).map(([name, motion]) => (
        <div key={name} className="flex flex-col items-start gap-8">
          <MotionDemo seed="analyst" motion={motion} />
          <SampleLabel>{name}</SampleLabel>
        </div>
      ))}
    </div>
  )
}
