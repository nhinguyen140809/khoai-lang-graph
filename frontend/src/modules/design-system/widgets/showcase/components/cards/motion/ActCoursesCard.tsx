'use client'

import { courseLooks, orbitLooks } from '../../../design-system.fixtures'
import type { CardEntry } from '../../../design-system.types'
import { withDefaults } from '../../../design-system.utils'
import { MotionRow } from '../../MotionRow'
import { SampleCard, SampleGroup } from '../../Sample'

export function ActCoursesCard() {
  return (
    <SampleCard
      title="Act courses and orbits"
      description="How a thing moves about its slot, and the orbits that turn it into a ring."
      className="flex flex-col gap-6"
    >
      <SampleGroup label="About its slot (course); copies of orbit make a ring (flat, or leaned like the orbit of a satellite), copies of burst and gather go one after another">
        <MotionRow looks={courseLooks} />
      </SampleGroup>
      <SampleGroup label="Orbits: a ring that is flat or leaned, turned about the line of sight, wide or tight, from another slot, and with more or fewer copies">
        <MotionRow looks={withDefaults(orbitLooks, { course: 'orbit', courseCycles: 1 })} />
      </SampleGroup>
    </SampleCard>
  )
}

export const actCoursesCardEntry = {
  id: 'act-courses',
  label: 'Act courses and orbits',
  section: 'motion',
  span: 12,
  keywords: 'motion act course orbit ring MotionDemo',
  View: ActCoursesCard,
} satisfies CardEntry
