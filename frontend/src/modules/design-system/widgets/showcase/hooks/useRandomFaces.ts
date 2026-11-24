import { useMemo, useState } from 'react'

import { faceCatalog, type FaceSpec, randomOf, randomSpec } from '@/shared/components/face'

/** How many faces are drawn at once. */
const faceCount = 8

/** The values that each kind of tag may take: what a person may ask a face to fit. */
export const tagCategories = faceCatalog.tagCategories

/**
 * Random faces within the tags that are chosen: each kind of tag a person narrows to some of its
 * values (none chosen, any value), and each face is a random pick among the variants that fit all
 * the kinds at once. `shuffle` draws them again.
 */
export function useRandomFaces() {
  const [chosen, setChosen] = useState<Readonly<Record<string, readonly string[]>>>({})
  const [round, setRound] = useState(0)
  const faces = useMemo(
    () =>
      Array.from({ length: faceCount }, (_unused, index): { seed: string; spec: FaceSpec } => {
        const seed = `random-${String(round)}-${String(index)}`
        return { seed, spec: randomSpec(chosen, randomOf(seed)) }
      }),
    [chosen, round],
  )

  return {
    chosen,
    faces,
    choose: (category: string, values: string[]) => {
      setChosen((before) => ({ ...before, [category]: values }))
    },
    shuffle: () => {
      setRound((before) => before + 1)
    },
  }
}
